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
var expect = require("chai").expect;
var cheerio = require("cheerio");

var url = "http://localhost:8080";
var csrf = "";
var cookieString ="";
var headers = {"X-CSRF-TOKEN":"", "Cookie":""}

describe("server", function() {
    it("get homepage", function(done) {
        request.get(url, function(error, response, body) {

            expect(response.statusCode).to.equal(200);
            done();

            var $ = cheerio.load(body);
            csrf = $('meta[name=csrf-token]').attr("content");
            headers['X-CSRF-TOKEN'] = csrf;
            cookieString = response.headers['set-cookie'][0]
            headers['Cookie'] = cookieString;
        });
    });

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
    it ("fails to get checkout by checkout_id due to unknwon checkout_id", function(done){
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
    it ("fails to get checkout by account_id due to unknown account_id", function(done){
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
    it("fails to get withdrawal by account_id due to unknown account_id", function(done){
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
    it("fails to get reserve by account_id due to unknown account_id", function(done){
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
    it("fails to get payer by email due to unknown email", function(done){
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
});
