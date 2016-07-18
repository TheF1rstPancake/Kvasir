var webpack = require('webpack')
var webpackDevMiddleware = require('webpack-dev-middleware')
var webpackHotMiddleware = require('webpack-hot-middleware')
var config = require('./webpack.config')
var bodyParser = require('body-parser')     //parse requests
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

function sendResponse(package, res) {
    res.setHeader('Content-Type', 'application/json');
    if ("error_code" in package) {
        console.log("Sending error!");
        res.status(500).send(JSON.stringify({"error_code":500, "error_description":"wepay call died.  check server logs for more details.", "error_message":package.error_description}));
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
        res.status(400).send(JSON.stringify({"error_code":400, "error_description":"database entry not found", "error_message":"No user exists with that email!  Please try again."}));
    }
}

function getDataWithAccountId(req, res, wepay_endpoint) {
    email = req.body.email;
    account_id = req.body.account_id;

    console.log("Getting info for: ", wepay_endpoint, email, account_id);
    res.setHeader('Content-Type', 'application/json');

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

/*
 * send a request to /v2/checkout/find and return the response
 * By default this will load 50 of the most recent checkouts
 */
app.post("/checkout", function(req, res) {
    getDataWithAccountId(req, res, "/checkout/find");
})

app.post("/user/resend_confirmation", function(req, res){
    getData(req, res, "/user/resend_confirmation");
})

app.post("/withdrawal", function(req, res){
    getDataWithAccountId(req, res, "/withdrawal/find");
})

app.listen(port, function(error) {
    if (error) {
        console.error(error)
    } else {
        console.info("==> 🌎  Listening on port %s. Open up http://localhost:%s/ in your browser.", port, port)
    }
})
