var webpack = require('webpack')
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')
var config = require('./webpack.config')
var bodyParser = require('body-parser')
var WePay = require("wepay").WEPAY;

var express = require("express");

var app = new (express)()
var port = 3000

var compiler = webpack(config)
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }))
app.use(webpackHotMiddleware(compiler))

// support JSON and url encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


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
        var error_package = {"error_code":500, "error_description":"wepay call died.  check server logs for more details.", "error_message":package.error_description}
        console.log("Sending error!\t", error_package);
        res.status(500).send(JSON.stringify(error_package));
    }
    else {
        res.send(JSON.stringify(package));
    }
}

/**
 * Make a request to the WePay API.  This will only work for endpoints that don't require the client_id or client_secret.
 * This function will return a successful response with the data from WePay or an error response that can be used in the front end.
 *
 * @param req               - ExpressJS request object
 * @param res               - ExpressJS response object
 * @param wepay_endpoint    - the endpoint on WePay that we want to hit
 */
function getData(req, res, wepay_endpoint) {
    email = req.body.email;
    console.log("Getting info for: ", wepay_endpoint, email);
    if (email && email == "giovannib+test05171604KYC@wepay.com") {
        var wepay_settings = {
            "access_token":     "STAGE_d452ad6379b3b60cdcc1e91e673906bac0922c3a143b53c12ef8f9c18c5f8228"
        }
        var wepay = new WePay(wepay_settings);
        wepay.use_staging();

        wepay.call(wepay_endpoint, {}, function(response) {
            var package = JSON.parse(response.toString());
            sendResponse(package, res);
        });
    }
    else {
        var error_package = {"error_code":400, "error_description":"database entry not found", "error_message":"No user exists with that email!  Please try again."}
        console.log("Error: ", error_package);
        res.status(400).send(JSON.stringify(error_package));
    }
}


/**
 * Make a request to the WePay API.  This will only work for endpoints that don't require the client_id or client_secret.
 * This function will return a successful response with the data from WePay or an error response that can be used in the front end.
 *
 * @param req               - ExpressJS request object
 * @param res               - ExpressJS response object
 * @param wepay_endpoint    - the endpoint on WePay that we want to hit
 * @param package           - the data you want to send to the WePay endpoint
 */
function getDataWithPackage(req, res, wepay_endpoint, package) {
    email = req.body.email;

    console.log("Getting info for: ", wepay_endpoint, email, package);
    res.setHeader('Content-Type', 'application/json');

    if (email && email == "giovannib+test05171604KYC@wepay.com") {
        var wepay_settings = {
            "access_token":     "STAGE_d452ad6379b3b60cdcc1e91e673906bac0922c3a143b53c12ef8f9c18c5f8228"
        }
        var wepay = new WePay(wepay_settings);
        wepay.use_staging();
        
        try {
            wepay.call(wepay_endpoint, package, function(response) {
                wepay_response = JSON.parse(response.toString());
                sendResponse(wepay_response, res);
            });
        }
        catch(error) {
            console.log(error);
        }

    }
    else {
        console.log("ERROR");

        res.status(400).send(JSON.stringify({"error_code":400, "error_description":"database entry not found", "error_message":"No user exists with that email!  Please try again."}));
    }
}

function getDataWithAccountId(req, res, wepay_endpoint) {
    email = req.body.email;
    account_id = req.body.account_id;

    console.log("Getting info for: ", wepay_endpoint, email, account_id);
    if (email && email == "giovannib+test05171604KYC@wepay.com") {
        var wepay_settings = {
            "access_token":     "STAGE_d452ad6379b3b60cdcc1e91e673906bac0922c3a143b53c12ef8f9c18c5f8228"
        }
        var wepay = new WePay(wepay_settings);
        wepay.use_staging();
        
        var package ={};
        try {
            wepay.call(wepay_endpoint, {"account_id":account_id}, function(response) {
                package = JSON.parse(response.toString());
                sendResponse(package, res);
            });
        }
        catch(error) {
            console.log(error);
        }

    }
    else {
        console.log("ERROR");
        res.setHeader('Content-Type', 'application/json');
        res.status(400).send(JSON.stringify({"error_code":400, "error_description":"database entry not found", "error_message":"No user exists with that email!  Please try again."}));
    }
}

/*send main file*/
app.get("/", function(req, res) {
    res.sendFile(__dirname + '/index.html')
})


/*send a request to /v2/user and return the response*/
app.post("/user", function(req, res) {
    getData(req, res, "/user");
})

/*send a request to /v2/account/find and return the response*/
app.post('/account', function(req, res){
    getData(req, res, "/account/find");
})

/**
 * This endpoint has two seperate actions depending on the parameters passed
 * If no checkout_id is given, then this will get the 50 most recent checkouts for the given account_id
 * If a checkout_id is given, then this will fetch information for that checkout specifically.
 * Passing the checkout_id is useful for updating a checkout's info after performing an action with the dashboard. 
 */
app.post("/checkout", function(req, res) {
    if (req.body.checkout_id) {
        var package = {"checkout_id":req.body.checkout_id}
        getDataWithPackage(req, res, "/checkout", package);
    }
    else {
        var package = {"account_id": req.body.account_id};
        if (req.body.start && req.body.start != '') {
            package.start = req.body.start;
        }
        getDataWithPackage(req, res, "/checkout/find", package);
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
    getDataWithPackage(req, res, "/withdrawal/find", {"account_id":req.body.account_id});
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
    getDataWithPackage(req, res, "/checkout/refund", package);
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
