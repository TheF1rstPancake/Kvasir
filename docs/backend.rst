.. _kvasirbackend:

The Back End: NodeJS and ExpressJS
=======================================
The backend infrastructure is meant to support the front end and address the security concerns that prevented us from making a full SPA.

The back-end is built using Node and ExpressJS.  While we personally prefer Python for our servers, bundling the resources and libraries necessary to run the front end part of the application was easier in Node.

.. warning::
    This is documentation on the current behavior of the back end server.  Many of the endpoints will likely change over time, and this is not meant to be a roadmap of the functionality they aim to provide.

Structure
----------------
The underlying structure is pretty simple.  Requests come in from the front end, and some of those requests will require the server to communicate with the platform's database, while others require requests to the WePay API, and then there are requests that will require both.

Each object built in the front-end app receives it's own endpoint on the server.  For example, the :ref:`user object <user_object>` makes all of it's requests to the */user* endpoint on the server.

.. note::
    While many of the endpoints on Kvasir's server mirror the endpoint names of WePay, it is not a 1 to 1 relationship.

When the front end makes a request, the back end is responsible for formatting it into something the partner middleware or WePay will understand.  This provides a useful layer of abstraction should something change in either of those two systems.

The server is also responsible for :ref:`packaging responses back to the client, including error messages <backend_sendingdatabacktoclient>`.  Every response is sent through the same function to ensure a level of consistency in the way that we report data back to the front end.  Typically, valid data is simply sent to the front end in the same format in which it was received.  The error structure is little more specific, but will also pass along the original, unaltered response as part of it.

Kvasir's node server also manages a small cookie based session for users.  We don't want to expose access tokens to the front end, but we also don't want to have to request the access token from the partner's database on each request.  After the server gets an access token, it will set a hashed cookie based on a secret key provided in Kvasir's configuration file.  The cookie cannot be accessed by the front end, and the only the server can unhash it into something readable.

Endpoints
-----------
Each front end object has an associated endpoint on the server.  An object *could* call another endpoint if it wanted to, but it is more likely to do that indirectly by dispatching that other object's actions.

All endpoints *only* accept POST requests with a JSON structured body.

User Endpoint
~~~~~~~~~~~~~~~
The user endpoint does two important actions:
    1) Get user information from the WePay :wepay:`user` endpoint
    2) Get the access token for the user from the platform's database

Aquiring an access token is actually the first step to most operations that Kvasir completes, but it requires going to the partner's database first to get it.  After receiving an access token back from the :ref:`middleware <kvasirmiddleware>`, the server will set it as a secure, hashed cookie in the browser.  This allows it to persist between calls so that we don't have to fetch the access token on each request.

.. http:post:: /user
    
    Get information about a merchant

    :<json email:        *(optional)* the merchants email
    :<json account_id:   *(optional)* a valid account_id associated with the partner

.. note::
    While both parameters are optional, one or the other must be provided

The user endpoint also has a special endpoint called */user/resend_confirmation*.  This is what the user object will call in order to resend email confirmation to a merchant who has not yet confirmed their account.

Account Endpoint
~~~~~~~~~~~~~~~~~~
The account endpoint simply makes requests to WePay.  However, depending on the parameters passed, it might do one of two different actions.

If no account_id is provided, the endpoint will make a request to :wepay:`account find` which will return all accounts associated with the user.  If an account_id is provided, the endpoint will make a request to :wepay:`account`, which will return information for just the specified account.

.. http:post:: /account

    Get information about an account

    :<json account_id: *(optional)* the account_id assoicated with the account that you want more info for.

Checkout Endpoint
~~~~~~~~~~~~~~~~~~~~
Very similar to the :http:post:`/account`, except it looks at :wepay:`checkout` instead.  If no checkout_id is provided, it will gather the 50 most recent checkouts for the given account_id.  If a checkout_id is provided, then it will only fetch information regarding that one checkout.

.. http:post:: /checkout

    Get a list of checkouts made for a given account_id, or get information about a single checkout_id

    :<json checkout_id:    *(optional)* the unique id of the checkout you want to search
    :<json acccount_id:     *(optional)* the unique id of the account that you want a list of checkouts for

.. note::
    While both parameters are optional, you must provide one or the other.

Widthdrawal Endpoint
~~~~~~~~~~~~~~~~~~~~~
We could have built the withdrawal endpoint in the same way that we built the :http:post:`/checkout` and :http:post:`/account` endpoints, but we didn't.  There is no real need to update a withdrawal after it's been rendered, so we have no need to search for just a single withdrawal.  This endpoint will gather the 50 most recent withdrawals for an account.

.. http:post:: /withdrawal

    Get withdrawal info for a given account_id

    :<json account_id:  the unique id of the account you want to gather withdrawals from

Refund Endpoint
~~~~~~~~~~~~~~~~~
Even though checkouts and refunds are merged into the same object, the refund part requires it's own endpoint.

Refunds are a complicated area.  The refund logic changes depending on who the *fee_payer* was in the original checkout.  However, all refunds have to go through the :wepay:`checkout refund` API endpoint.  This endpoint requires the checkout_id for the given checkout and a reason for why the checkout is being refunded.

.. http:post:: /refund

    Do a full or partial refund for a given checkout

    :<json checkout_id:     the id of the checkout you want to refund
    :<json refund_reason:   the reason you are refunding the checkout
    :<json amount:          *(optional)* how much you are refunding the checkout for.  If no amount is passed, a full refund is completed

Reserve Endpoint
~~~~~~~~~~~~~~~~~~
The reserve endpoint is typically hit at the same time as the withdrawal endpoint, and they function similiarly.

This endpoint will gather the reserve information about an account from :wepay:`account get_reserve_details`.

.. http:post:: /reserve

    Get reserve information about a particular account

    :<json account_id:  the id of the account you want reserve information for.

Payer Endpoint
~~~~~~~~~~~~~~~~~~
The */payer* endpoint does not make any calls to the WePay API.  It interacts only with the middleware to access a list of all of the checkouts that a given payer has completed on that platform.

.. http:post:: /payer
    
    Given a set of search parameters for a payer, retrieval all checkouts from the middleware that match those search parameters.

    :<json email:   the email of the payer that we are searching for

Credit Card Endpoint
~~~~~~~~~~~~~~~~~~~~~~~~
The credit_card endpoint allows us to get more information about a tokenized credit card.  

.. http:post:: /credit_card
    
    Get more information from WePay about a tokenized credit card id

    :<json credit_card_id:  the tokenzied id of the credit_card


Getting Data From WePay
---------------------------

.. _nodejssdk:  https://github.com/wepay/NodeJS-SDK

Kvasir's NodeJS server facilitates communication with the WePay API and the partner middleware.  WePay has several pre-made SDKs for communicating with their API.  Kvasir uses the `NodeJS SDK <nodejssdk>`_.

.. note::
    If you want to use the SDK, download it from GitHub and not from npm.  The npm version is not up to date.

The `NodeJS SDK <nodejssdk>`_ will format all of our requests so that they match what the WePay API expects.  The two biggest parts of that are setting the *Authorization* and *Content-Type* headers.

The *Authorization* header is where a user's access token is placed, and the *Content-Type* is always "application/json".

Kvasir provides a single function for communicating with `WePay's NodeJS SDK <nodejssdk>`_.

.. function:: getWePayData(res, wepay_endpoint, access token, package)
    
    Request data from the given wepay_endpoint, using the specified access token and package.  This function will immediately send the response back to the client

    :param res:                 ExpressJS response object
    :param wepay_endpoint:      the wepay endpoint that we want to get data from
    :param access token:        the user's access token that we want to use to request data. **NOTE**: This value can be null if the endpoint does not require an access token
    :param pacakge:             the package of data we want to send to the wepay_endpoint.  This can be an empty object if the endpoint does not require any additional parameters.

We talk a lot about retrieving access tokens from the middleware as a critical component of accessing data from the WePay API.  While many of the endpoints require an access token, not all of them do.  For example, the :wepay:`credit_card` endpoint does not require an acces token.  Instead, it wants the platform's client_id and client_secret in the body of the request.

Each endpoint on Kvasir's server is responsible for creating the call to :func:`getWePayData` including formatting the package that it sends.  

Managing Access Tokens
~~~~~~~~~~~~~~~~~~~~~~~~~
We wanted to avoid a system that had to make a request to the partner's database for a user's access token for each request.  While this would certainly work, it increases the overhead of each request unnecessarily.

Kvasir uses Express's `cookie_session <https://github.com/expressjs/cookie-session>`_ library to securely store a user's access token as a cookie in the client's browser.  The cookies are hashed with a secret key and set with the *secure* and *httpOnly* flags.  These force the cookies to be sent only over an HTTPS connection, and prevent JavaScript functions in the browser from being able to access the cookie information.  

From within Kvasir's ExpressJS server, the cookie is accessed via:
    >>> req.session.access token

Most of the endpoints will check if this value is set before making any requests to WePay.  If the access token is not present, Kvasir will raise an error back to the client saying that it cannot perform the request because it does not have all of the required info.

Getting Data From the Middleware
-------------------------------------
In order to be able to get information such as access tokens and a list of all checkouts a payer has completed on a given platform, Kvasir uses the idea of a platform generated middleware that allows it to communicate with a platform's database.

The ExpressJS server has two functions for communicating with the middleware.

.. function:: getDataFromMiddleware(resource, data, callback)
    
    Given a resource, and package of data, send a request to the middleware.
    Once the request is complete, it will call the callback function provided.

     :param resource:   the resource that we want to search on the partner's database (also referred to as *objects* such as user, account, payer)
     :param data:       the package we use to query information about the provided resource
     :param callback:   a callback function to execute after the middleware returns information.  Typically this is :func:`parseMiddlewareResponse`

.. function:: parseMiddlewareResponse(req, res, error, response, body, wepay_endpoint, wepay_package)

    Parse the response from the middleware and decide what to do with it.
    If the middleware sends an error, raise that error back to the client
    If a wepay_endpoint is provided, then use the information provided by the client and request information from the provided endpoint with the wepay_package.
    If no wepay_endpoint is provided, then just send the results from the middleware back to the client.

    :param req:             Expresses Request object
    :param res:             Express Response object
    :param error:           A JSON structure with error information (empty if no error occured)
    :param response:        A detailed response object
    :param body:            A JSON structure with returned data
    :param wepay_endpoint:  The wepay_endpoint to hit after receiving a response from the middleware
    :param wepay_package:   The package to send to the wepay_endpoint


First Kvasir will call :func:`getDataFromMiddleware` where necessary.  This will send a associated POST request to the platform's middleware to get the information we need.  Once it receives the response it will pass the information to the callback function provided.

Most of Kvasir's endpoints will use :func:`parseMiddlewareResponse` to do that.  When we go to the middlware it is likely because we want a user's access token and then be able to do an associated call to the WePay API.  :func:`parseMiddlewareResponse` will do that for us.  It will pull the access token out of the response and format a request to :func:`getWePayData` (which will subsequently send the data to the client).

The other option for a callback is to just pass the information we receive from the middleware directly back to the client.  This is what :http:post:`/payer` does.  It passes :func:`sendResponse` has the callback function in order to pass the response from the middleware directly back to the client.

.. _backend_sendingdatabacktoclient:

Sending Data Back to the Client
--------------------------------
The final step to any request is to send the data back to the client.  Kvasir provides a single function for this operation as well.

.. function:: sendResponse(package, res)

    Send a response back to the client.  This function will also take care of sending back errors.

    Headers:
        - **Content-Type**: application/json

    :param package:     the data to send back to the user
    :param res:         the ExpressJS response object

This function does not format the response data.  It will pass it verbatim back to the client.  So if the endpoint you hit makes a call to the WePay API, then you will receive back the response from the WePay API, and only that response.

The exception here is errors.  We do extra error reporting so that the errors that you receive as a result of both the middleware and WePay API are similar.  This is intended to make error handeling easier.

An example error can be seen below:

    .. code-block:: javascript
        
        {
            "error_code": 500,
            "error_description": "wepay_call died. Check server logs for more details"
            "error_message": "Cannot refund checkout after 60 days"
            "original_error": {
                "error": "invalid_request",
                "error_description": "Cannot refund checkout after 60 days"
                "error_code": 1003
            }
        }

The "error_message" field is intended to be a string that you can display to the end user so that they know what went wrong.  We include the original error package sent by either the middleware or WePay API for greater transparceny.  We don't want to accidently truncate errors and lead developers down the wrong path.


Server Configuration
-------------------------
There is some information that Kvasir needs in order to function outside of information that it could access from the middleware.

The configuration file is small, but contains necessary information for Kvasir to run properly.

A sample configuration file looks like this:
    .. code-block:: javascript
        
        var config ={};

        config.cookie_secret = "<SOME_RANDOM_JUMBLE_OF_LETTERS_AND_NUMBERS>";
        config.middleware_uri= "https://<address_to_your_middleware>";
        config.middleware_secret = "<SOME_RANDOM_JUMBLE_OF_LETTERS_AND_NUMBERS>";

        config.port = 3000;

        // wepay client_id and client_secret are needed for certain calls
        config.client_id = "<YOUR_WEPAY_CLIENT_ID>";
        config.client_secret = "<YOUR_WEPAY_CLIENT_SECRET>";

        module.exports = config;

It must be saved in the root directory of Kvasir and be named **config.js**.

The configuration contains two secret keys:
    - cookie_secret:        a secret key to hash your cookie session with
    - middleware_secret:    a secret key to use when making requests to your middleware.  It is placed in an *Authorization* header with each request.

The *middleware_secret* should be shared with your middleware so that it can validate that the requests it is receiving are actually from Kvasir and not from someone else.

It also needs the address of your middleware.  This provides it some flexibility in the event that the address changes.  This way you don't have to manipulate the source code.

The configuration also requires your WePay client_id and client_secret.  There are certain WePay API requests that require this info in place of an access token.  Providing it in the config file lets Kvasir access it when necessary.

Generating Secret Keys
~~~~~~~~~~~~~~~~~~~~~~~~
There are a lot of different methods for generating secret keys.

`Random Key Generator <http://randomkeygen.com/>`_ will do it for you, or you can use Python to quickly genreate key.

The Python code is:
    >>> import binascii
    >>> import os
    >>> binascii.hexlify(os.urandom(24))
    >>> '0ccd512f8c3493797a23557c32db38e7d51ed74f14fa7580'

Copy the output and paste it into the config file.  It is important that you **do not share your secret key**.  You also shouldn't use that key there, because it's not secret if it's published somewhere.