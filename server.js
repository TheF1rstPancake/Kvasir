var webpack = require('webpack')
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')
var config = require('./webpack.config')
var bodyParser = require('body-parser')
var request = require("request")

// library for securely handeling hashed cookie objects
var cookieSession = require("cookie-session")

// WePay library
var WePay = require("wepay").WEPAY;

// express library for defining routes
var express = require("express");

// load app configuration settings
var app_config = require('./config')

// create the express app and define what port this is open on
var app = new (express)()
var port = app_config.port


// load webpack compiler
var compiler = webpack(config)
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }))
app.use(webpackHotMiddleware(compiler))

// support JSON and url encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// setup cookie based sessions
app.use(cookieSession({
    name:"session",
    secret: app_config.cookie_secret
}))

app.use('/static', express.static('static'));

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
    if ("error_code" in package) {
        var error_package = {"error_code":500, "error_description":"wepay call died. Check server logs for more details.", "error_message":package.error_description, "original_error":package}
        console.log("Sending error!\t", error_package);
        return res.status(500).send(JSON.stringify(error_package));
    }
    else {
        console.log("Sending package back to client: ", package);
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
        wepay_settings.access_token = access_token;
    }

    var wepay = new WePay(wepay_settings);
    wepay.use_staging();

    console.log("Making request to wepay: ", wepay_endpoint, package);

    try {
        wepay.call(wepay_endpoint, package, function(response) {
            sendResponse(JSON.parse(response.toString()), res);
        });
    }
    catch(error) {
        //res.setHeader('Content-Type', 'application/json');
        console.log("ERROR WITH WEPAY: ", error);
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

    return request.post(
        {
            "url":uri, 
            "json":data,
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
        return sendResponse(body, res);
    }
    else {
        if (body.access_token) {
            console.log("Setting access token cookie:\t", body.access_token);
            req.session.access_token = body.access_token;
            return getWePayData(res, wepay_endpoint, req.session.access_token, wepay_package);
        }
        return sendResponse(body, res);
    }
}


/*send main file*/
app.get("/", function(req, res) {
    res.sendFile(__dirname + '/index.html')
})

/*send a request to /v2/user and return the response*/
app.post("/user", function(req, res) {
    console.log('Incoming user request: ', req.body);
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

/*send a request to /v2/account/find and return the response*/
app.post('/account', function(req, res){
    console.log("Received request for account info: ", req.body);
    if (!req.session.access_token) {
        return getDataFromMiddleware(
            "account",
            {},
            function(error, response, body) {
                return;
            }
        );
    }
    else {
        var package = {};
        if (req.body.account_id) {
            package['account_id'] = req.body.account_id;
            return getWePayData(res, "/account", req.session.access_token, package);
        }
        return getWePayData(res, "/account/find", req.session.access_token, package);
    }
})

/**
 * This endpoint has two seperate actions depending on the parameters passed
 * If no checkout_id is given, then this will get the 50 most recent checkouts for the given account_id
 * If a checkout_id is given, then this will fetch information for that checkout specifically.
 * Passing the checkout_id is useful for updating a checkout's info after performing an action with the dashboard. 
 */
app.post("/checkout", function(req, res) {
    // prep the package and wepay_endpoint we want to hit
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

    // check if an access token has already been set.  If not, we are going to need to get one
    if (!req.session.access_token) {
        return getDataFromMiddleware(
            "checkout",
            {},
            function(error,response, body) {
                return parseMiddlewareResponse(req, res, parseMiddlewareResponse, error, response, body, wepay_endpoint, package)
            }
        );
    }
    else {
        return getWePayData(res, wepay_endpoint, req.session.access_token, package);
    }
    
})

/**
 * Resend the confirmation email to a user
 */
app.post("/user/resend_confirmation", function(req, res){
    getDataWithPackage(req, res, "/user/resend_confirmation", {});
})

/**
 * Get a list of the 50 most recent withdrawals for the given account_id
 */
app.post("/withdrawal", function(req, res){
    var package = {"account_id":req.body.account_id};
    if(!req.session.access_token) {
        getDataFromMiddleware(
            "withdrawal", 
            {}, 
            function(error, response, body) {
                return parseMiddlewareResponse(req, res, error, response, body, "/withdrawal/find", package);
            }
        );
    }
    else {
        getWePayData(res, "/withdrawal/find", req.session.access_token, package);
    }
})

/**
 * Perform a refund for a given checkout_id.
 * This endpoint requires the checkout_id and a refund_reason.
 * The amount field should be used to perform a partial refund.  
 * If no amount is passed, this will do a full refund
 */
app.post("/refund", function(req, res) {
    var package = {"checkout_id":req.body.checkout_id, "refund_reason":req.body.refund_reason};
    if (req.body.amount) {
        package['amount'] = req.body.amount;
    }
    if(!req.session.access_token) {
        getDataFromMiddleware(
            "checkout", 
            {}, 
            function(error, response, body) {
                return parseMiddlewareResponse(req, res, error, response, body, "/checkout/refund", package);
            }
        );
    }
    else {
        getWePayData(res, "/checkout/refund", req.session.access_token, package);

    }
})

/**
 * Get reserve information from the WePay API.
 * Requires an access token and an account_id
 *
 */
app.post("/reserve", function(req, res) {
    if(!req.session.access_token) {
        console.log("ERROR: do not have an access token to work with");
    }
    else {
        getWePayData(res, "/account/get_reserve_details", req.session.access_token, {"account_id":req.body.account_id});
    }
});

/**
 * Given a payer's unique identifying information (such as their email), get a list of all of their checkouts from the middleware
 */
app.post("/payer", function(req, res) {    
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
app.post("/credit_card", function(req, res){
    var credit_card_id = parseInt(req.body.credit_card_id);

    getWePayData(res, "/credit_card", null, {"credit_card_id":credit_card_id, "client_id":app_config.client_id, "client_secret":app_config.client_secret});
})

/**
 * Start the application
 */
app.listen(port, function(error) {
    if (error) {
        console.error(error)
    } else {
        console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port)
    }
})
