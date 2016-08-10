.. _kvasirtesting:

Testing Kvasir
=================
Kvasir comes with a direcrory called *test* that contains a set of `Mocha <https://mochajs.org/>`_ tests that use `Chai's <http://chaijs.com/>`_ assertion API to make sure that Kvasir's server is performing as expected.

To achieve this, the *test* directory also contains a sample middleware written in Python that uses a small JSON file as a "database."  The JSON file contains a handful of live WePay objects (from the stage environment) that allow you to check to make sure that Kvasir has everything it needs to perform correctly.


Running the Tests
------------------------
There are a couple of configuration options that you have to set in order for the test cases to work the first time:
    - KVASIR_MIDDLEWARE_TEST_URI=http://localhost:5000
        * the Python middleware server will run on port 5000 and we want to tell Kvasir to use this URL for running tests

You can either set this in your `.env` file or via environment variables.

When you run Kvasir you want to run it as:
    >>> npm start -- --test

This will launch Kvasir in test mode and overwrite the value of KVASIR_MIDDLEWARE_URI with the value on KVASIR_MIDDLEWARE_TEST_URI.  It will also override the value of KVASIR_MIDDLEWARE_SECRET with the value provided in the test JSON "database."

After this is set up, open another terminal window and navigate to the *test* directory and run:
    >>> pip install -r requirements.txt
    >>> python middleware.py

The first line will install all required libraries for our middleware to run.  The second will actually launch it.

The middleware loads the JSON file into memory in order to simulate what it would look like if this was actually live.  Originally, we wrote only failure test cases, because we couldn't be certain what values would be in every database that tries to integrate with us.  It's hard to write a test to successfully query a user based on their email if you don't know what emails you have avaialable.

Now launch a third terminal and navigate to Kvasir's main source directory and run:
    >>> npm test

This will launch a series of test cases, all of which should succeed.

These tests are designed to make sure that the server and the middleware:
    1) can communicate with one another
    2) are returning data in the expected format
    3) are returing errors when they are supposed to

The tests are broken up into two sections - server tests and middleware tests.  The server tests rely on communication with the middleware to succeed, so if your middleware is not working properly the server tests will fail, but just because the server tests fail does not mean its a result of a middleware. So we provide tests that will specifically query your middleware to provide more clarity as to why tests may be failing.

.. note::
    These test cases are not exhaustive.  For example, it does not check that :http:post:`/preapproval/cancel` actually works, because we can only cancel a preapproval once so always having a preapproval on hand to test is difficult.


Testing your Middleware
----------------------------
While a middleware is readily provided, the KVASIR_MIDDLEWARE_TEST_URI is meant to provide you with the ability to change what URI you are testing against, and thereby what middleware you test against.

All Kvasir cares about is that the middleware is present and returns data as expected.  As you develop your own middleware, you can use the testing cases provided to make sure that your middleware provides the necessary data in the expected format.  Build your middleware, and then change the KVASIR_MIDDLEWARE_TEST_URI and you will test against whatever URI you provide.

None of these tests check that the React components are working properly.  That is on the to-do list; however, the React components should behave as expected as long as the data they receive is in the right format.  So having test cases that simply check the format of the data that Kvasir sends to the front end allows us to be reasonably confident that your middleware works in all cases with Kvasir.

The Test Middleware
~~~~~~~~~~~~~~~~~~~~~~
The test middleware provided can be used as example of how you should develop your middleware.  The provided middleware is a slightly edited copy of the one we made during the development of Kvasir.  That one actually runs on the Google App Engine and makes use of the GAE Datastore instead of a JSON file for it's database, but the functionality is consistent across both.

If you are comfortable with Python and Flask, you can take the provided middleware and modify the *KvasirBlueprint* class to connect to your database rather than the `test.json` file.  

The Test Values
~~~~~~~~~~~~~~~~~~~~~~
The provided test "database" is meant to replicate what you might find in your database at a very basic level.  It provides the test suite with values it can send to the Kvasir server and your middleware to validate that everything is working properly.

.. note::
    The sample middleware we provide uses the test values as it's own internal database too.  That way, when it receives a query for one of the provided keys, it can provide a response that mimics what we would send in production.  Your test middleware does not have to rely on the `test.json` file as it's own database too, but the values in `test.json` should be values that actually exist in your database.

The database contains a handful of top-level keys:
    - Users
        * to access a valid WePay user object
        * the keys **must** be valid WePay user emails associated with your application.  The information they point to is not important
    
    - Accounts
        * to access a valid WePay account object
        * the keys **must** be valid WePay account_ids associated with your app.  The information they point to is not important
    
    - Checkouts
        * to access a valid WePay checkout object
        * the keys **must** be valid WePay checkout_ids associated with your app

    - Payers
        * to access an object the represents payers on your application
        * the keys **must** be valid emails tied to transactions on your app

    - middleware_secret_key
        * Shared secret key between the test suite, Kvasir, and your middleware to allow requests to pass through
    
    - credit_card_id
        * A valid credit_card id associated with your application 
    
    - preapproval_id
        * A valid preapproval id associated with your application

All of these values are generated in the WePay **Stage** environment.  You likely do not want to include production level information in this file.  The Users, Accounts, and Checkouts keys all point to other objects that include live Stage information.  This allows us to continue working on the test cases to not only check that the endpoints send back information, but that they send back the *right* information.

The Users, Accounts, and Checkouts objects likely include more information than is necessary.  Your database may not be configured the same as ours, so you may associate completely different information.  

Users
^^^^^^^^
The *Users* key points to another object where the keys are user emails and the values are objects that represent what you pull out of your database about that user.

If we look at the default values provided, we see that the User object has:
            
    .. code-block:: javascript

        "gbriggs2012+test08091601@gmail.com": {
            "username": "gbriggs2012+test08091601@gmail.com", 
            "access_token": "SOME_TOKEN", 
            "creation_time": 1470758670, "user_id": 118034129
        }

The key here is a valid email to a valid WePay user object associated with our test application.  In our development database, we store the user's email, their WePay access_token, the time that the user registered with us and their WePay user_id.  The information that you put in here might be different, but remember the point of the middleware is to take a key (like an email or account id) and return an access token to Kvasir.  So you should at least include an access token here.

Accounts
^^^^^^^^^^^^
The *Accounts* key points to an object where the keys are WePay account_ids.  Like the object under the *Users* key, this object has all of the information that we typically store with an account_id.

.. code-block:: javascript
    
    "1964530060":{
                    "username": "gbriggs2012+test08091601@gmail.com", 
                    "user_id": 118034129, 
                    "account_id": 1964530060, 
                    "creation_time": 1470758670, 
                    "account_info": {
                        "name": "My Fundraiser", 
                        "firstname": "Giovanni", 
                        "lastname": "Briggs", 
                        "email": "gbriggs2012+test08091601@gmail.com", 
                        "description": "Fundraising!"} 
            }

At the very least, you need to include a set of account_ids that point to empty objects.  The test middleware provided happens to use this "test.json" file as it closely mimics our production database on the Google App Engine, so we provide additional info here to send back with certain requests.

Checkouts
^^^^^^^^^^^^^^
The *Checkouts* key points to an object where the keys are WePay checkout_ids and each checkout_id points to an object that represents that checkout.

.. code-block:: javascript
    
     "555763278": {
            "account_id": 1964530060, 
            "payment_method": "credit_card", 
            "creation_time": 1470759670, 
            "checkout_id": 555763278, 
            "payer_email": "gbriggs2012+payer@gmail.com", 
            "data": {"refund": {"amount_refunded": 0, "refund_reason": null}, "payment_method": {"type": "credit_card", "credit_card": {"auto_capture": true, "data": {"emv_receipt": null, "signature_url": null}, "id": 3722644581}}, "currency": "USD", "create_time": 1470758296, "auto_release": true, "long_description": null, "account_id": 1964530060, "gross": 26.02, "fee": {"processing_fee": 1.02, "app_fee": 0, "fee_payer": "payer"}, "payment_error": null, "npo_information": null, "state": "authorized", "chargeback": {"dispute_uri": null, "amount_charged_back": 0}, "short_description": "Fundraising!", "type": "goods", "hosted_checkout": null, "delivery_type": null, "in_review": false, "checkout_id": 555763278, "reference_id": null, "soft_descriptor": "WPY*My Fundraiser", "payer": {"home_address": null, "email": "gbriggs2012+payer@gmail.com", "name": "John Shepard"}, "amount": 25, "callback_uri": null}, "payment_method_id": 3722644581
        }

Again, all that is important is that the key you provide here is a valid checkout_id.  The rest of the information is optional and will help if we chose to expand the test cases to check that the *correct* information is returned, not that just some information is returned.

Payers
^^^^^^^
The *Payers* key points to an object where the keys are emails associated with payers on your application.

.. code-block:: javascript
     
    "gbriggs2012+payer@gmail.com": {}

We use the keys provided to query the :http:post:(middleware)/payer endpoint.  Using the given key, your application should return a list of all checkouts that this payer has completed.


