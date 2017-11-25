/**
 * Test file for Kvasir's backend server.
 * Most of these cases check to make sure that Kvasir fails apporpriately when it is supposed to do.
 * It is hard to check if Kvasir will return the correct information because we do not know what data you have in your database
 * So we can't write the test to include emails and account ids that will work for everyone
 * Knowing that it fails is a good place to start though, and that these failures don't kill the server
 *
 * Testing that everything works is much easier to do via the front end.  The error conditions aren't always easy to catch so that's why we test them here.
 */

var request = require("request");
var chai = require("chai");
var expect = chai.expect;
chai.should();
chai.use(require('chai-things'));

var cheerio = require("cheerio");

var database = require("./test.json");



// load the varaibles that the Kvasir server uses
// this allows us to make calls directly to the middleware
var dotenv  = require('dotenv');
var fs = require("fs");
//var kvasir_config = {};
var env_file = fs.readFileSync('.env');
var kvasir_config = dotenv.parse(env_file.toString('utf8'));

describe("middleware", function(){
     /**
     * test the /user endpoint
     */
    var middleware_uri = kvasir_config.KVASIR_MIDDLEWARE_TEST_URI;
    var middleware_headers = {"Authorization":database.middleware_secret_key, "Content-Type":"application/json"}
    console.log(middleware_headers);
    describe("user endpoint", function() {
        /*this test should fail because the authorization header is not right*/
        it("fails to get info due to bad Authorization header", function(done){
            this.timeout(10000);
            request.post(
                {
                    uri: middleware_uri+"/user",
                    json:{"account_owner_email": Object.keys(database.Users)[0] },
                    headers:{"Authorization":null, "Content-Type":"application/json"}
                },
                function(error, response, body) {
                    expect(body).to.include.keys("error_message");
                    expect(response.statusCode).to.equal(403);
                    done();
                }
            )
        });
        /*this test should give us an error because the email is unknown*/
        it("fails to get access_token by email due to unknown email", function(done) {
            this.timeout(10000);
            request.post(
                {
                    url: middleware_uri+"/user",
                    json:{"account_owner_email":"xxx"},
                    headers: middleware_headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("error_message");
                    expect(response.statusCode).to.equal(200);
                    done();
                }
            );
        });
        /**
         * this test should give us an error because the account_id is unknown
         */
        it("fails to get access_token by account_id due to unknown account_id", function(done) {
            this.timeout(10000);
            request.post({
                    url: middleware_uri+"/user",
                    json:{"account_id":"-1"},
                    headers:middleware_headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("error_message");
                    expect(response.statusCode).to.equal(200);
                    done();
                }
            );
        });
        /**
         * This test should successfully return an access token because the user email is known
         */
        it("gets access_token by email", function(done) {
            this.timeout(10000);
            request.post({
                    url:middleware_uri+"/user",
                    json:{"account_owner_email":Object.keys(database.Users)[0]},
                    headers:middleware_headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("access_token");
                    expect(response.statusCode).to.equal(200);
                    done();
                }
            );
        });
        /**
         * This test should return an access token because the account id is known
         */
        it("gets access_token by account_id", function(done) {
            this.timeout(10000);
            request.post({
                    url:middleware_uri+"/user",
                    json:{"account_id":Object.keys(database.Accounts)[0]},
                    headers:middleware_headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("access_token");
                    expect(response.statusCode).to.equal(200);
                    done();
                }
            );
        });
    });

    /**
     * Check the payer endpoint
     */
     xdescribe("payer endpoint", function() {
        /**
         * request should fail if the authorization header is not set correctly
         */
        it("fails to get info due to bad Authorization header", function(done){
            this.timeout(10000);
            request.post(
                {
                    uri: middleware_uri+"/user",
                    json:{"payer_email":database.Checkouts[Object.keys(database.Checkouts)[0]].payer_email},
                    headers:{"Authorization":null, "Content-Type":"application/json"}
                },
                function(error, response, body) {
                    expect(body).to.include.keys("error_message");
                    expect(response.statusCode).to.equal(403);
                    done();
                }
            )
        });
        /**
         * if we pass an invalid email, we should get an error
         */
        it("fails to get payer by email due to unknown email", function(done){
            this.timeout(10000);
            request.post({
                    url: middleware_uri+"/payer",
                    json:{"payer_email":"-1"},
                    headers:middleware_headers
                },
                function(error, response, body) {
                    expect(body.payer_checkouts).to.be.empty;
                    done();
                }
            );
        });
        /**
         * Provide a list of checkouts when the payer email is valid
         */
        it("gets list of payer checkouts by payer_email", function(done) {
            this.timeout(15000);
            request.post({
                    url:middleware_uri+"/payer",
                    json:{"payer_email":Object.keys(database.Payers)[0]},
                    headers:middleware_headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("payer_checkouts");
                    expect(body.payer_checkouts[0]).to.include.keys(["checkout_id", "account_id"]);
                    done();
                }
            );
        });
    });

});

/**
 * Run tests against Kvasir's server.
 * These will test the middleware at the same time, but the middleware tests are provided to give more clarity as to why a server test might be failing.
 */
describe("server", function() {
    var url = "http://localhost:5000";
    var csrf = "";
    var cookieString ="";
    var headers = {
      "X-CSRF-TOKEN":"", "Cookie":"",
      "Authorization":database.middleware_secret_key
    }
    /*try and get the homepage from the server*/
    it("gets homepage", function(done) {
        var web_url = "http://localhost:8080";
        request.get(web_url, function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();

            var $ = cheerio.load(body);
            csrf = $('meta[name=csrf-token]').attr("content");
            headers['X-CSRF-TOKEN'] = csrf;
            cookieString = response.headers['set-cookie'][0]
            headers['Cookie'] = cookieString;
        });
    });
    /**
     * test the /user endpoint
     */
    describe("user endpoint", function() {
        /*this test should give us an error because the email is unknown*/
        it("fails to get user by email due to unknown email", function(done) {
            this.timeout(10000);
            request.post(
                {
                    url: url+"/user",
                    json:{"email":"xxx"},
                    headers: headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("error_message");
                    done();
                }
            );
        });
        /**
         * this test should give us an error because the account_id is unknown
         */
        it("fails to get user by account_id due to unknown account_id", function(done) {
            this.timeout(10000);
            request.post({
                    url: url+"/user",
                    json:{"account_id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("error_message");
                    done();
                }
            );
        });
        /**
         * This test should successfully return the user object from WePay
         */
        it("gets WePay user object by email", function(done) {
            this.timeout(10000);
            request.post({
                    url:url+"/user",
                    json:{"email":Object.keys(database.Users)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("user_id");
                    done();
                }
            );
        });
        /**
         * Get the WePay user object by passing an account_id
         */
        it("gets WePay user object by account_id", function(done) {
            this.timeout(10000);
            request.post({
                    url:url+"/user",
                    json:{"account_id":Object.keys(database.Accounts)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("user_id");
                    done();
                }
            );
        });
    });
    /**
     * Test the /account endpoint
     */
    describe("account endpoint", function() {
        /**
         * Fail to get the WePay account object because we sent an unknown email
         */
        it("fails to get account by email due to unknown email", function(done) {
            this.timeout(10000);
            request.post({
                    url: url+"/account",
                    json:{"email":"xxx"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        /**
         * Fail to get the WePay account object because we sent an unknown account_id
         */
        it ("fails to get account by account_id due to unknown account_id", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/account",
                    json:{"account_id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        /**
         * Get the WePay account object by email.
         * If this is successful, the response will be a list of accounts
         */
        it("gets list of WePay account object by email", function(done) {
            this.timeout(10000);
            request.post({
                    url:url+"/account",
                    json:{"email":Object.keys(database.Users)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.be.a("array");
                    done();
                }
            );
        });
        /**
         * Get the WePay account object by account_id
         * this should only return one object and include the key "account_id"
         */
        it("gets WePay account object by account_id", function(done) {
            this.timeout(10000);
            request.post({
                    url:url+"/account",
                    json:{"account_id":Object.keys(database.Accounts)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("account_id");
                    done();
                }
            );
        });
    });
    /**
     * Check the checkout endpoint
     */
    describe("checkout endpoint", function() {
        it ("fails to get checkout by checkout_id due to unknown checkout_id", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/checkout",
                    json:{"checkout_id":"-1", "account_id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        /**
         * Make sure that it returns an error if an unknwon account_id is passed
         */
        it ("fails to get checkout by account_id due to unknown account_id", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/checkout",
                    json:{"account_id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        /**
         * Check that providing a checkout_id will only fetch one checkout
         */
        it("gets WePay checkout object by checkout_id; even with account_id present", function(done) {
            this.timeout(10000);
            request.post({
                    url:url+"/checkout",
                    json:{"checkout_id":Object.keys(database.Checkouts)[0], "account_id":Object.keys(database.Accounts)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("checkout_id");
                    done();
                }
            );
        });
        /**
         * Check that checkouts returns a list of checkouts when using an account_id
         */
        it("gets WePay checkout objects by account_id", function(done) {
            this.timeout(10000);
            request.post({
                    url:url+"/checkout",
                    json:{"account_id":Object.keys(database.Accounts)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.be.a("array");
                    done();
                }
            );
        });
    })
    /**
     * Check the withdrawal endpoint
     */
    xdescribe("withdrawal endpoint", function(){
        /**
         * Return an error when an unknown account_id is provided
         */
        it("fails to get withdrawal by account_id due to unknown account_id", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/withdrawal",
                    json:{"account_id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        /**
         * provide a list of withdrawals when a valid account_id is provided
         */
        it("gets list of WePay withdrawal object by account_id", function(done) {
            this.timeout(15000);
            request.post({
                    url:url+"/withdrawal",
                    json:{"account_id":Object.keys(database.Accounts)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.be.a("array");
                    done();
                }
            );
        });
    });
    /**
     * Check the reserve endpoint
     */
    xdescribe("reserve endpoint", function() {
        /**
         * Return an error when there is an unknown account_id
         */
        it("fails to get reserve by account_id due to unknown account_id", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/reserve",
                    json:{"account_id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        /**
         * provide a list of reserves when a valid account_id is provided
         */
        it("gets list of WePay reserve object by account_id", function(done) {
            this.timeout(15000);
            request.post({
                    url:url+"/reserve",
                    json:{"account_id":Object.keys(database.Accounts)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.inc
                    expect(body).to.not.have.property("error_message");
                    done();
                }
            );
        });
    });
    /**
     * Check the payer endpoint
     */
    describe("payer endpoint", function() {
        /**
         * if we pass an invalid email, we should get an error
         */
        it("fails to get payer by email due to unknown email", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/payer",
                    json:{"email":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body.payer_checkouts).to.be.empty;
                    done();
                }
            );
        });
        /**
         * provide an object when the email is valid
         *
         * This object ha a single key called *payer_checkouts* that then contains a list.  But the presence of the key is enough
         */
        it("gets list of payer checkouts by payer_email", function(done) {
            this.timeout(15000);
            request.post({
                    url:url+"/payer",
                    json:{"email":Object.keys(database.Payers)[0]},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.include.keys("payer_checkouts");
                    expect(body.payer_checkouts[0]).to.include.keys(["checkout_id", "account_id"]);
                    done();
                }
            );
        });
    });

    /**
     * Check credit card
     *
     */
     xdescribe("credit_card endoint", function(){
        it("fails to get credit card if credit card is unknown", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/credit_card",
                    json:{"id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        it("get the credit card object", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/credit_card",
                    json:{"id":database.credit_card_id},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("credit_card_id");
                    done();
                }
            );
        });
    });
    /**
     * Check preapproval object
     */
     xdescribe("preapproval endoint", function(){
        it("fails to get preapproval if it is unkown", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/preapproval",
                    json:{"id":"-1"},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("error_message");
                    done();
                }
            );
        });
        it("get the preapproval object", function(done){
            this.timeout(10000);
            request.post({
                    url: url+"/preapproval",
                    json:{"id":database.preapproval_id},
                    headers:headers
                },
                function(error, response, body) {
                    expect(body).to.have.property("preapproval_id");
                    done();
                }
            );
        });
    });
});
