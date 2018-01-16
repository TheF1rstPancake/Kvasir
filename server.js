var bodyParser = require('body-parser')
var request = require("request")
var url = require("url");


// WePay library
var WePay = require("wepay").WEPAY;

// HTTPS server
var https = require("https")
var http = require("http");

// file reader
var fs = require("fs")

// express library for defining routes
var express = require("express");

// try and load a .env file.
// This will put out a warning if one does not exist but that's fine
// if it doesn't exist, you should be setting the environment variables manually.
require("dotenv").config();

// grab any command line arguments that were passed
// for example, those that put the application in "test" mode
var argv = require("yargs").argv;
console.log(argv);


// load app configuration settings
// pull all of the environment variables down into a dictionary
var app_config = {
    "cookie_secret": process.env.KVASIR_COOKIE_SECRET,
    "middleware_uri": process.env.KVASIR_MIDDLEWARE_URI,
    "middleware_secret": process.env.KVASIR_MIDDLEWARE_SECRET,
    "port": process.env.KVASIR_MIDDLEWARE_PORT ? process.env.KVASIR_MIDDLEWARE_PORT : 8080,
    "client_id": process.env.KVASIR_CLIENT_ID,
    "client_secret": process.env.KVASIR_CLIENT_SECRET,
    "http_override":process.env.KVASIR_HTTP_OVERRIDE,
    "ssl": {
        "privateKey": process.env.KVASIR_SSL_PRIVATE_KEY,
        "certificate": process.env.KVASIR_SSL_CERTIFICATE
    },
    "middleware_test_uri": process.env.KVASIR_MIDDLEWARE_TEST_URI,
    "test_mode": argv.test,
    "wepay_production": process.env.KVASIR_WEPAY_USE_PRODUCTION && process.env.KVASIR_WEPAY_USE_PRODUCTION == "true" ? true : false

}


console.log("Lauching app with following config: ", app_config);

// create the express app and define what port this is open on
var app = new (express)();
var port = app_config.port;

// webpack loading
var config = require('./webpack.config');
if(process.env.NODE_ENV !== 'production') {
  console.log("Not in production mode!  Running webpack");
  var webpackDevMiddleware = require('webpack-dev-middleware');
  var webpackHotMiddleware = require('webpack-hot-middleware');
  var webpack = require('webpack');
  var compiler = webpack(config);

  app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
}


// setup cookie parser and csrf protection
var cookieParser = require("cookie-parser")
var csrf = require("csurf");
var csrfProtection = csrf(
    {cookie:{
            secure: app_config.http_override ? false : true,
            httpOnly: true
        }
    }
);
app.use(cookieParser(app_config.cookie_secret))


// support JSON and url encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));


// load ssl certificate
// for more information refer to this StackOverflow post:
//      http://stackoverflow.com/questions/11744975/enabling-https-on-express-js
//
// For help with generating an SSL certificate and key:
//      https://devcenter.heroku.com/articles/ssl-certificate-self
var credentials = {};
if (!app_config.http_override) {
    var privateKey = fs.readFileSync(app_config.ssl.privateKey, "utf8");
    var certificate = fs.readFileSync(app_config.ssl.certificate, "utf8");
    var credentials = {key: privateKey, cert: certificate};
}

app.use(config.output.publicPath, express.static(config.output.path));


var expressWinston = require("express-winston");
var winston = require("winston");

// create a logger for our other log inputs
// we remove the default Console logger and add our own to allow for more fine-tuned formatting
winston.add(winston.transports.File, {
    level:"info",
    filename:"logs/log.log",
    timestamp: true,
    json: true,
    colorize: true
});
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize: true,
    timstamp:true
})

// define our logger
// the expressWinston.logger only logs the HTTP(s) requests and response
// the expressWinston.errorLogger is at the bottom of the file.  It has be
var expressTransports = [
        new winston.transports.Console({
            colorize: true,
            timstamp:true,
        }),
        new winston.transports.File({
            filename:"logs/log.log",
            level: 'info',
            json:true,
            timestamp:true,

        })
]
app.use(expressWinston.logger({
    transports: expressTransports,
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    expressFormat: true
}));

// use ejs for our template engine
// point the app to the static folder
app.use('/static', express.static('static'));
app.set("view engine", "ejs");

/**
 * Send main application page
 *
 * This will also invalidate any previously held session on the site.
 * So refreshing the page effectively kills all session information.
 */
app.get("/", csrfProtection, function(req, res) {
    // render the main page with the csrf token
    winston.info("Loading page");
    res.render((__dirname + '/index.ejs'), {csrfToken: req.csrfToken()});
})

/**
 * Verify that everything in the app configuration is going to work
 *
 * It checks to make sure that:
 *      - middleware_uri is set to use HTTPS
 *      - the private key and certificates are defined
 */
function verifyConfig(conf) {
    winston.info("Checking middleware uri protocol: ", url.parse(conf.middleware_uri).protocol)
    var middleware_protocol = url.parse(conf.middleware_uri).protocol;
    if (middleware_protocol != "https" && middleware_protocol != "https:") {
        throw(new Error("Middleware URI is not HTTPS."));
    }

    if (!privateKey && !conf.http_override) {
        throw(new Error("Private key is not defined.  Check to make sure that the file actually exists and contains information"));
    }
    if(!certificate && !conf.http_override) {
        throw(new Error("Private key is not defined.  Check to make sure that the file actually exists and contains information"));
    }
    return true;
}

/**
 * Send a response back to the client.
 * This function also takes care of sending back errors when the WePay request fails.
 * It will include the WePay error_description as well.
 *
 * @param package   - the data to send back to the user
 * @param res       - ExpressJS response object
 */
function sendResponse(package, res) {
    res.setHeader('Content-Type', 'application/json');
    if (package.error_code) {
        var error_package = {
            "error_code":500,
            "error_description":"wepay call died. Check server logs for more details.",
            "error_message":package.error_description,
            "original_error":package}
        winston.warn("Sending error!\t", error_package);
        return res.status(500).send(JSON.stringify(error_package));
    }
    else {
        winston.info("Sending package back to client");
        return res.send(JSON.stringify(package));
    }
}

/**
 * Request data from the given wepay_endpoint, using the specified access_token and package.  This function will immediately send the response back to the client
 *
 * @param res               -   Express response object
 * @param wepay_endpoint    -   the WePay API endpoint we want to hit
 * @param access_token      -   the access token we want to use with the request.  NOTE: for certain endpoints, this can be *null*
 * @param package           -   the package of data we want to send along with request.  This can be an empty object depending on the endpoint
 */
function getWePayData(res, wepay_endpoint, access_token, package) {

    var wepay_settings = {}

    if (access_token) {
        winston.info("Aquired access_token: ", access_token);
        wepay_settings.access_token = access_token;
    }

    // set wepay settings and chose production or stage
    var wepay = new WePay(wepay_settings);
    if (app_config.wepay_production) {
        winston.info("Using wepay in production mode")
        wepay.use_production()
    }
    else {
        wepay.use_staging();
    }

    winston.info("Making request to wepay: ", wepay_endpoint, package);

    try {
        wepay.call(wepay_endpoint, package, function(response) {
            sendResponse(response, res);
        });
    }
    catch(error) {
        //res.setHeader('Content-Type', 'application/json');
        winston.error("ERROR WITH WEPAY: ", error);
        res.status(500).send(JSON.stringify(error));
    }
}

/*
 * Given a resource, and package of data, send a request to the middleware.
 * Once the request is complete, it will call the callback function provided.
 *
 * Refer to the middleware specification for more details about what resources are available and what each resource expects in it's data package
 *
 * @params resource - the resource that we want to search on the partner's database.  This should be user, account, or payer
 * @params data     - the package we use to query information about the provided resource
 * @params callback - a callback function to execute after the middleware returns information.  Typically this is `parseMiddlewareResponse`
 */
function getDataFromMiddleware(resource, data, callback) {
    var uri = app_config.middleware_uri+"/"+resource;
    winston.info("Requesting data from middleware: ", uri, data);
    return request.post(
        {
            url:    uri,
            json:   data,
            headers: {
                "Authorization":app_config.middleware_secret
            }

        },
        callback
    );
}

/*
 * Parse the response from the middleware and decide what to do with it.
 * If the middleware sends an error, raise that error back to the client
 * If a wepay_endpoint is provided, then use the information provided by the client and request information from the provided endpoint with the wepay_package
 * If no wepay_endpoint is provided, then just send the results from the middleware back to the client
 *
 * @params req            -   Expresses Request object
 * @params res            -   Express Response object
 * @params error          -   A JSON structure with error information (empty if no error occured)
 * @params response       -   A detailed response object
 * @params body           -   A JSON structure with returned data
 * @params wepay_endpoint -   The wepay_endpoint to hit after receiving a response from the middleware
 * @params wepay_package  -   The package to send to the wepay_endpoint
 */
function parseMiddlewareResponse(req, res, error, response, body, wepay_endpoint, wepay_package) {
    if (body.error) {
        // send error
        body.error_code = 500;
        body.error_description = body.error_message;
        res = res.status(500);
        return sendResponse(body, res);
    }
    else {
        if (body.access_token) {
            winston.info("Requesting data from wepay: ", wepay_endpoint);
            return getWePayData(res, wepay_endpoint, body.access_token, wepay_package);
        }
        return sendResponse(body, res);
    }
}

/**
 * Get a user's access token from the middleware and then make the associated v2/user lookup call on the WePay API
 *
 * In the request body we expect:
 *  @param email        -   (optional) the email associated with the user
 *  @param account_id   -   (optional) an account_id
 *
 * Given either of these fields, the middleware should be able to handle it and give us back an access token.
 */
app.post("/user", csrfProtection, function(req, res) {
    winston.info('Incoming user request: ', req.body);
    var package = {};

    // get the email from the search
    var email = req.body.email;
    var account_id = req.body.account_id;

    // get the necessary data from our middleware function and then make the corresponding request to WePay
    getDataFromMiddleware(
        "user",
        {
            "account_owner_email":email,
            "account_id": account_id
        },
        function(error, response, body) {
          return parseMiddlewareResponse(req, res, error, response, body, "/user", {});
        }
    );
})

/*
 * Send a request to /v2/account/find and return the response
 *
 * In the request body, we expect:
 *  @param account_id -     (optional) an account_id tied to the access token set in a cookie
 *
 * The account_id field is optional.  If it is present, we fetch only that accounts information via v2/account
 * If it is not present, we fetch all accounts owned by the user who owns the access token via the v2/account/find endpoint
 */
app.post('/account', csrfProtection, function(req, res){
    winston.info("Received request for account info: ", req.body);
    var package = {};
    var wepay_endpoint = "";

    // if we have an account_id, then just look up that particular account
    if (req.body.account_id) {
        winston.info("Received account_id, looking only for account: ", req.body.account_id);
        package['account_id'] = req.body.account_id;
        wepay_endpoint = "/account";
        return getDataFromMiddleware(
            "user",
            {"account_id":req.body.account_id},
            function(error, response, body){
                parseMiddlewareResponse(req, res, error, response, body, wepay_endpoint, package)
        });
    }

    // otherwise lookup all accounts associated with the provided email
    winston.info("No account_id.  Looking for all accounts belonging to: ", req.body.email);
    wepay_endpoint = "/account/find";
    return getDataFromMiddleware("user", {"account_owner_email": req.body.email}, function(error, response, body){
        parseMiddlewareResponse(req, res, error, response, body, wepay_endpoint, package);
    });
})

/**
 * This endpoint has two seperate actions depending on the parameters passed
 * If no checkout_id is given, then this will get the 50 most recent checkouts for the given account_id
 * If a checkout_id is given, then this will fetch information for that checkout specifically.
 * Passing the checkout_id is useful for updating a checkout's info after performing an action with the dashboard.
 */
app.post("/checkout", csrfProtection, function(req, res) {
    // prep the package and wepay_endpoint we want to hit
    winston.info("Received request for checkout");
    var package = {};
    var wepay_endpoint = "";
    if (req.body.checkout_id) {
        package = {"checkout_id":req.body.checkout_id};
        wepay_endpoint = "/checkout";
    }
    else {
        package = {"account_id": req.body.account_id};
        if (req.body.start && req.body.start != '') {
            package.start = req.body.start;
        }
        wepay_endpoint = "/checkout/find";
    }

    return getDataFromMiddleware("user", {"account_id":req.body.account_id}, function(error, response, body){
        parseMiddlewareResponse(req, res, error, response, body, wepay_endpoint, package);
    });
})

/**
 * Resend the confirmation email to a user
 */
app.post("/user/resend_confirmation", csrfProtection, function(req, res){
    getDataWithPackage(req, res, "/user/resend_confirmation", {});
})

/**
 * Get a list of the 50 most recent withdrawals for the given account_id
 */
app.post("/withdrawal", csrfProtection, function(req, res){
    winston.info("Received request for withdrawals");
    var package = {"account_id":req.body.account_id};
    return getDataFromMiddleware(
        "user",
        {"account_id":req.body.account_id},
        function(error, response, body) {
            parseMiddlewareResponse(req, res, error, response, body, "/withdrawal/find", package);
    });
})

/**
 * Perform a refund for a given checkout_id.
 *
 * This endpoint expects the following fields in the body of the request:
 *  @param checkout_id     -   the checkout_id
 *  @param refund_reason   -   the reason that the checkout is being refunded
 *  @param amount          -   (optional) initates a partial refund for the specified amount
 *  @param app_fee         -   (optional) initiates a partial refund for the specified app_fee amount
 * The amount field should be used to perform a partial refund.
 * When doing a partial refund, you can also pass a app_fee that specifies how much of the app_fee you want to refund
 *
 * If no amount is passed, this will do a full refund
 */
app.post("/refund", csrfProtection, function(req, res) {
    winston.info("Received request for refund");
    var package = {"checkout_id":req.body.checkout_id, "refund_reason":req.body.refund_reason};
    if (req.body.amount != null || req.body.app_fee != null) {
        if (req.body.amount) {
                package['amount'] = req.body.amount;
            }
            if (req.body.app_fee) {
                package['app_fee'] = req.body.app_fee;
            }
    }

    return getDataFromMiddleware(
        "user",
        {"account_id":req.body.account_id},
        function(error, response, body){
            return parseMiddlewareResponse(req, res, error, response, body, "/checkout/refund", package)
        }
    );
})

/**
 * Get reserve information from the WePay API.
 * Requires an access token and an account_id
 *
 */
app.post("/reserve", csrfProtection, function(req, res) {
    winston.info("Received request for reserve");
    return getDataFromMiddleware(
        "user",
        {"account_id": req.body.account_id},
        function(error, response, body) {
            return parseMiddlewareResponse(req, res, error, response, body, "/account/get_reserve_details", {"account_id":req.body.account_id});
        }
    );
});

/**
 * Given a payer's unique identifying information (such as their email), get a list of all of their checkouts from the middleware
 */
app.post("/payer", csrfProtection, function(req, res) {
    winston.info("Received request for payer");
    // get the email from the search
    var email = req.body.email;
    // get the necessary data from our middleware function and then make the corresponding request to WePay
    return getDataFromMiddleware(
        "payer",
        {"payer_email":email, "num_elements":50},
        function(error, response, body) {
            return parseMiddlewareResponse(req, res, error, response, body, null, null);
        }
    );
})

/*
 * Given a credit_card_id (tokenized card) get more information about the card from the v2/credit_card WePay API endpoint
 */
app.post("/credit_card", csrfProtection, function(req, res){
    winston.info("Received request for credit_card: ", req.body);
    var credit_card_id = parseInt(req.body.id);

    getWePayData(res, "/credit_card", null, {"credit_card_id":credit_card_id, "client_id":app_config.client_id, "client_secret":app_config.client_secret});
})

/*get preapproval info*/
app.post("/preapproval", csrfProtection, function(req, res){
    winston.info("Receieved request for preapproval");
    var preapproval = parseInt(req.body.id);

    getWePayData(res, "/preapproval", null, {"preapproval_id":preapproval, "client_id":app_config.client_id, "client_secret":app_config.client_secret});

});

/*cancel a preapproval*/
app.post("/preapproval/cancel", csrfProtection, function(req, res){
    winston.info("Receieved request for preapproval cancellation");
    var preapproval = parseInt(req.body.preapproval_id);

    getWePayData(res, "/preapproval/cancel", null, {"preapproval_id":preapproval, "client_id":app_config.client_id, "client_secret":app_config.client_secret});

})

// define the error logger.
// it uses the same transports as the normal logger, and will write all errors to a special file for easier access
var error_transport = new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
        json: true,
        timestamp:true
    });
app.use(expressWinston.errorLogger({
    transports: [error_transport],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    expressFormat: true
}));


/**
 * Start the application
 *
 * Before we start, make sure that the app configuration meets the requirements
 * But we use a hack here to get around the check for testing
 * The test environment does not need to use HTTPS for the middleware, so after we check the config and it's squeaky clean, we update the middleware uri in the even that we are in test mode
 * we also want to use a different middleware secret when we are test
 */
verifyConfig(app_config);


if (app_config.test_mode){
    console.log("Updating config because of test mode.");
    app_config.middleware_uri = app_config.middleware_test_uri;
    app_config.middleware_secret = require("./test/test.json").middleware_secret_key;
    console.log("New config: ", app_config);
}

if (app_config.http_override) {
    var httpsServer = http.createServer(app);
}
else {
    var httpsServer = https.createServer(credentials, app);
}
httpsServer.listen(process.env.PORT || '8080', function(error) {
    if (error) {
        console.error(error)
    } else {
        console.info("==> 🌎  Listening on port %s. Open up https://localhost:%s/ in your browser.", process.env.PORT || '8080', process.env.PORT || '8080')
    }
});
