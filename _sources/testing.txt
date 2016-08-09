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

.. note::
    These test cases are not exhaustive.  For example, it does not check that http:post:`/preapproval/cancel` actually works, because we can only cancel a preapproval once.

Testing your Middleware
----------------------------
While a middleware is readily provided, the KVASIR_MIDDLEWARE_TEST_URI is meant to provide you with the ability to change what URI you are testing against, and thereby what middleware you test against.

All Kvasir cares about is that the middleware is present and returns data as expected.  As you develop your own middleware, you can use the testing cases provided to make sure that your middleware provides the necessary data in the expected format.  Build your middleware, and then change the KVASIR_MIDDLEWARE_TEST_URI and you will test against whatever URI you provide.

None of these tests check that the React components are working properly.  That is on the to-do list; however, the React components should behave as expected as long as the data they receive is in the right format.  So having test cases that simply check the format of the data that Kvasir sends to the front end allows us to be reasonably confident that your middleware works in all cases with Kvasir.