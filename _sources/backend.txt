.. _kvasirbackend:

The Back-End: NodeJS and ExpressJS
=======================================
The back-end infrastructure is meant to support the front-end and address the security concerns that prevented us from making a full SPA.

The back-end is built using Node and ExpressJS.  While we personally prefer Python for our servers, bundling the resources and libraries necessary to run the front-end part of the application was easier in Node.

.. warning::
    This is documentation on the current behavior of the back-end server.  Many of the endpoints will likely change over time, and this is not meant to be a roadmap of the functionality they aim to provide.

Structure
----------------
The underlying structure is pretty simple.  Requests come in from the front-end, and some of those requests will require the server to communicate with the platform's database, while others require requests to the WePay API, and then there are requests that will require both.

Each object built in the front-end app receives it's own endpoint on the server.  For example, the :ref:`user object <user_object>` makes all of it's requests to the */user* endpoint on the server.

.. note::
    While many of the endpoints on Kvasir's server mirror the endpoint names of WePay, it is not a 1 to 1 relationship.

When the front-end makes a request, the back-end is responsible for formatting it into something the partner middleware or WePay will understand.  This provides a useful layer of abstraction should something change in either of those two systems.

The server is also responsible for :ref:`packaging responses back to the client, including error messages <back-end_sendingdatabacktoclient>`.  Every response is sent through the same function to ensure a level of consistency in the way that we report data back to the front-end.  Typically, valid data is simply sent to the front-end in the same format in which it was received.  The error structure is little more specific, but will also pass along the original, unaltered response as part of it.

Kvasir's node server also manages cookies on the client's browser.  Right now, the only cookie is a CSRF cookie used to manage our CSRF protection.  The cookie has the ``secure`` and ``httpOnly`` flags set so that the cookie must be set over HTTPS, and it cannot be accessed by client side JavaScript.  Additionally, the CSRF token is placed in the HTML of the page itself via our templating engine.

Endpoints
-----------
Each front-end object has an associated endpoint on the server.  An object *could* call another endpoint if it wanted to, but it is more likely to do that indirectly by dispatching that other object's actions.

All endpoints *only* accept POST requests with a JSON structured body and will verify that they contain a CSRF token.

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

    :<json email:       *(optional)* used to get a merchant's access token from the middleware.  If account_id is not passed, then this endpoint will fetch all accounts registered to this user.
    :<json account_id: *(optional)* the account_id assoicated with the account that you want more info for.

.. note::
    If the account_id is provided, then this endpoint will use the account_id to gather the merchant's access token.  You can still pass an email, but it is not required.


Checkout Endpoint
~~~~~~~~~~~~~~~~~~~~
Very similar to the :http:post:`/account`, except it looks at :wepay:`checkout` instead.  If no checkout_id is provided, it will gather the 50 most recent checkouts for the given account_id.  If a checkout_id is provided, then it will only fetch information regarding that one checkout.

.. http:post:: /checkout

    Get a list of checkouts made for a given account_id, or get information about a single checkout_id

    :<json checkout_id:    *(optional)* the unique id of the checkout you want to search
    :<json acccount_id:    used to get a merchant's access token.  If the checkout_id is not passed, then this endpoint will fetch all 

.. note::
    While both parameters are optional, you must provide one or the other.

Widthdrawal Endpoint
~~~~~~~~~~~~~~~~~~~~~
We could have built the withdrawal endpoint in the same way that we built the :http:post:`/checkout` and :http:post:`/account` endpoints, but we didn't.  There is no real need to update a withdrawal after it's been rendered, so we have no need to search for just a single withdrawal.  This endpoint will gather the 50 most recent withdrawals for an account.

.. http:post:: /withdrawal

    Get withdrawal info for a given account_id

    :<json account_id:  the unique id of the account you want to gather withdrawals from (also used to fetch a merchant's access token from the middleware)

Refund Endpoint
~~~~~~~~~~~~~~~~~
Even though checkouts and refunds are merged into the same object, the refund part requires it's own endpoint.

Refunds are a complicated area.  The refund logic changes depending on who the *fee_payer* was in the original checkout.  However, all refunds have to go through the :wepay:`checkout refund` API endpoint.  This endpoint requires the checkout_id for the given checkout and a reason for why the checkout is being refunded.

.. http:post:: /refund

    Do a full or partial refund for a given checkout

    :<json checkout_id:     the id of the checkout you want to refund
    :<json account_id:      the account that we are performing a refund for.  Used to fetch a merchant's access token from the middleware
    :<json refund_reason:   the reason you are refunding the checkout
    :<json amount:          *(optional)* how much you are refunding the checkout for.  If no amount is passed, a full refund is completed

Reserve Endpoint
~~~~~~~~~~~~~~~~~~
The reserve endpoint is typically hit at the same time as the withdrawal endpoint, and they function similiarly.

This endpoint will gather the reserve information about an account from :wepay:`account get_reserve_details`.

.. http:post:: /reserve

    Get reserve information about a particular account

    :<json account_id:  the id of the account you want reserve information for (also used to fetch a merchant's access token from the middleware)

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
    :param access_token:        the user's access token that we want to use to request data. 
    :param pacakge:             the package of data we want to send to the wepay_endpoint.  This can be an empty object if the endpoint does not require any additional parameters.

.. note::
    The ``access_token`` field can be null if the WePAy endpoint doesn't require an access token.

We talk a lot about retrieving access tokens from the middleware as a critical component of accessing data from the WePay API.  While many of the endpoints require an access token, not all of them do.  For example, the :wepay:`credit_card` endpoint does not require an acces token.  Instead, it wants the platform's client_id and client_secret in the body of the request.

Each endpoint on Kvasir's server is responsible for creating the call to :func:`getWePayData` including formatting the package that it sends.  

Managing Access Tokens
~~~~~~~~~~~~~~~~~~~~~~~~~
Access tokens are a very sensitive matter.  If someone were to gain access to a merchant's access token, they could do a lot of damage with it.

In order to prevent this from occurring, we fetch the access token on each request from the partner's database.  This has small performance issues, but realistically, it's not terrible.  It's really the main function of the middleware, so you should build it with performance in mind.

Getting Data From the Middleware
-------------------------------------
In order to be able to get information such as access tokens and a list of all checkouts a payer has completed on a given platform, Kvasir uses the idea of a :ref:`platform generated middleware <kvasirmiddleware>` that allows it to communicate with a platform's database.

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


First Kvasir will call :func:`getDataFromMiddleware` for every endpoint that requires a merchant's access token (which is almost all of them).  This will send a associated POST request to the platform's middleware to get the information we need.  Once it receives the response it will pass the information to the callback function provided.

Most of Kvasir's endpoints will use :func:`parseMiddlewareResponse` to do that.  When we go to the middlware it is likely because we want a user's access token and then be able to do an associated call to the WePay API.  :func:`parseMiddlewareResponse` will do that for us.  It will pull the access token out of the response and format a request to :func:`getWePayData` (which will subsequently send the data to the client).

The other option for a callback is to just pass the information we receive from the middleware directly back to the client.  This is what :http:post:`/payer` does.  It passes :func:`sendResponse` has the callback function in order to pass the response from the middleware directly back to the client.

.. _back-end_sendingdatabacktoclient:

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

.. _serverconfiguration:

Server Configuration
-------------------------
There is some information that Kvasir needs in order to function outside of information that it could access from the middleware.

Originally, Kvasir used a configuration file which was just a JavaScript file that exported an object containing all of the info.  The configuration file is hidden from the git repository because the configuration file contains secret keys that you don't want to expose.  The problem with this approach is that for many third-party hosting sites (such as Heroku) use a git repository to pull in the necessary source files for your application.  Every file that you want uploaded has to be contained in the repository, so having a hidden configuration file is not helpful.

What these sites offer instead is the ability to set environment variables, which still provides us the ability to configure our environment with information that Kvasir needs to run without exposing that information to unwanted parties.

Environment Variables
~~~~~~~~~~~~~~~~~~~~~~~
All of the environemtn variables that Kvasir uses start with KVASIR.  This isolates it's environment variables from any other applications.

This is the entire list of environment variables:

    - **KVASIR_COOKIE_SECRET**:        the secret key used to "encrypt" cookies set in the browser
    - **KVASIR_MIDDLEWARE_URI**:       the uri to the middleware which connects to your database
    - **KVASIR_MIDDLEWARE_SECRET**:    the secret key used in the `Authorization` header when making requests to the middleware
    - **KVASIR_CLIENT_ID**:            your WePay client id
    - **KVASIR_CLIENT_SECRET**:        your WePay client secret
    - **KVASIR_SSL_PRIVATE_KEY**:      *(optional)* the name of the file that contains your SSL private key
    - **KVASIR_SSL_CERTIFICATE**:      *(optional)* the name of the file that contains your SSL certificate
    - **KVASIR_HTTP_OVERRIDE**:        *(optional)* boolean to tell Kvasir to launch under an HTTP server instead of an HTTPS server

.. note::
    You must supply either KVASIR_HTTP_OVERRIDE as `True` **or** supply both KVASIR_SSL_CERTIFICATE and KVASIR_SSL_PRIVATE_KEY.  

Environment File
~~~~~~~~~~~~~~~~~~~
An environment file can still be defined to set the values of the different environment variables.  Some third party hosting services (such as the Google App Engine) will take all files in your current directory and upload those instead of using a git repository.  These types of services don't always provide a way to set environment variables remotely, so the hidden file works in those cases.

.. note::
    If you are adding additional functionality into Kvasir (in other words, you are actively developing Kvasir), then you should define use the `.env` file.  It makes testing and manipulating the environment variables a little easier.

Kvasir will check for the presence of the environment file using the `dotenv <https://www.npmjs.com/package/dotenv>`_ package which will then set all of the environment variables accordingly.  This way, the other parts of Kvasir don't have to worry about where the configuration values are coming from.  It will check the enviornment variables and pull them into an object that all of it's routes and functions are free to reference.

The file should be named `.env` and be placed in the same directory as `server.js`.

A sample environment file looks like this:
    .. code-block:: python

        KVASIR_COOKIE_SECRET = YOUR_COOKIE_SECRET
        KVASIR_MIDDLEWARE_URI = https://your.middle.ware/
        KVASIR_MIDDLEWARE_SECRET = YOU_MIDDLEWARE_SECRET
        KVASIR_CLIENT_ID = YOUR_WEPAY_CLIENT_ID
        KVASIR_CLIENT_SECRET = YOUR_WEPAY_CLIENT_SECRET
        KVASIR_HTTP_OVERRIDE =  TRUE_OR_FALSE

Generating Secret Keys
~~~~~~~~~~~~~~~~~~~~~~~~
There are a lot of different methods for generating secret keys.

`Random Key Generator <http://randomkeygen.com/>`_ will do it for you, or you can use Python to quickly genreate a key.

The Python code is:
    >>> import binascii
    >>> import os
    >>> binascii.hexlify(os.urandom(24))
    >>> '0ccd512f8c3493797a23557c32db38e7d51ed74f14fa7580'

Copy the output and paste it into the config file.  It is important that you **do not share your secret key**.  You also shouldn't use that key there, because it's not secret if it's published somewhere.

Serving Over HTTPS
~~~~~~~~~~~~~~~~~~~~~~
In order to securely pass data around this system, we require that the server use HTTPS.  You can do it with any existing SSL certificates that you have or you can generate a self signed certificate.  

.. note::
    If you use a self signed certificate, your users will get a warning from the browser saying that the site is not trusted.  They can ignore the error and enter.
    But we **highly** recommend you use a certificate signed by a certificate authority.

The enviroment variables allow you to specify where the certificate and key are stored.  The path should be **relative to the server.js file**.

If you need help creating a self-signed SSL certificate, you can follow this tutorial:
    https://devcenter.heroku.com/articles/ssl-certificate-self

Load Balancers and Third Party Hosting
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Some load balancers (such as nginx) and third party hosting services (such as Google App Engine) can implement the HTTPS connection for you and sometimes have difficulty communicating with their underlying processes if they require HTTPS.  For example, when we tried to do a test deployment to the Google App Engine, it was having trouble communicating with the underlying NodeJs server.  We were able to trace the issue back to the fact that the GAE was not expecting the underlying processes to be running on HTTPS so it was unable to communicate with it and there are no apparent configuration options to allow us to force it to expect that.

But the GAE (and even Heroku) implement HTTPS by default.  All communication with the client is done over HTTPS, but communication to it's underlying processes (since they often fire off multiple instances of your application) is done via HTTP.  It is important to make sure that the connection to the end user is done over HTTPS to make sure the information you are sending to them cannot be intercepted and used by another party.

The `KVASIR_HTTP_OVERRIDE` environment variable is used to tell Kvasir to run using HTTP instead of HTTPS.  This is meant to be used in conjuction with a load balancer or thrid party hosting site that can make sure the connection to the end user is done over HTTPS.

If you are not using a load balancer or third party hosting site, then make sure you are providing `KVASIR_SSL_PRIVATE_KEY` and `KVASIR_SSL_CERTIFICATE` so that Kvasir can enable HTTPS.

Templating Engine
~~~~~~~~~~~~~~~~~~~~
Kvasir uses `EJS <https://www.npmjs.com/package/ejs>`_ for our templating engine.  The main purpose of the templating engine is to allow us to embed the server side generated CSRF token in the HTML.
