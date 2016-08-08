.. _kvasirmiddleware:

The Middleware: Whatever Language You Want
=============================================
The purpose of the middleware is to provide Kvasir access to a platform's database.  It is up to each platform to develop their middleware in a way that meets the specifications that Kvasir expects.

The middleware is meant to be lightweight and rather uncomplicated.  Kvasir takes care of a brunt of the work, all it needs is a little extra help from the platform to fill in some of the blanks.

This document details what those specifications are.

A Quick Note about Languages
----------------------------------
When developing Kvasir, we constructed a middleware that connected to a set of fake data.  Our middleware is developed in Python, so most of the code examples in this documentation will also be shown in Python.

**You do not have to use Python.**  You may use any language that you feel comfortable in.  There is really no one language that would be better than any other.  As long as it can receive and respond to POST requests and communicate with your underlying database, then it will work for this application.


Middleware Specifications
---------------------------
If you read the :ref:`back-end server documentation <kvasirbackend>` then you know that Kvasir's NodeJS server comes with one function for communicating with the middleware (:func:`getDataFromMid2dleware`).

This function is very simple, all it does is format it's parameters into a POST request with a callback function.

The idea is that the middleware gives Kvasir access to different *resources* in the partner's database.  Those resources are queried via a set of data included in the body of the request, and then the response is sent to a callback function which then decides what to do with the data.

Currently the list of available resources that your middleware should support are:
    - user
        access to a merchant's information.  Specifically their access token
    - payer
        access to a payer's information.  Specifically a list of all checkouts that payer has performed on your platform.

Each resource corresponds with a different endpoint on your middleware.  The *user* resource is accessed by going to https://<your_server_address>/user.  They should only accept POST requests.  It may be possible that a endpoint is requesting data that will require you to access multiple tables, and that is fine.  The whole point to the middleware is to allow you to figure out how to get the required information based on the given parameters.

Overall, these are the requirements for the middleware:
    - A server that connects to your internal database
    - Contains a set of endpoints where each endpoint is responsible for returning very specific data back to Kvasir
    - These endpoints only accept POST requests
    - These endpoints validate the *Authorization* header contained in each request to validate that the request actually came from Kvasir
    - Uses HTTPS for handling incoming requests

.. note::
    Many of the middleware endpoints have names that match endpoints on the Kvasir server (and the WePay API).  There is not a 1 to 1 map between all of these different APIs.  Middleware endpoints will have *"(middleware)"* in front of all of them in order to separate them from the Kvasir server endpoints.

Authorization
~~~~~~~~~~~~~~~~~
Security was a concern when developing the specifications for the middleware.  Exposing your database to another application posses some risk.

In order to help mitigate the security concerns, all requests to the middleware will have an *Authorization* header similar to the way the *Authorization* header is required when sending a request to WePay.  This header will contain a shared secret between your middleware and Kvasir.  If the Authorization header is not present in a request, or does not match the secret, you **should not process the request**.

You should also make sure that your middleware uses HTTPS for all incoming requests.  Otherwise you expose yourself to man in the middle attacks where someone could sniff out the shared secret.

User Resource
~~~~~~~~~~~~~~~~~~
The user resource should be accessed via the *(middleware)/user* endpoint.

.. http:post:: (middleware)/user
    
    Get an access token for a merchant given the passed search parameters

    :reqheader Authorization:   shared-secret key between your middleware and Kvasir
    :reqheader Content-Type:    application/json

    :form acount_owner_email:   *(optional)* the email used when registering the WePay merchant.  This is likely the same email they used to sign up on your platform
    :form account_id:           *(optional)* the account_id that we need to find the associated access token for

    :>json access_token:    the access_token for the user

This endpoint has two use cases:
    1) given an email address, find the merchant tied to it and get their access token.
    2) given an account_id, find the merchant tied to it and get their access token.

We don't always have the merchant's email address readily available.  In the event that a payer comes to you and asks for a refund, they may not know the merchant's email address, and that information isn't contained in WePay's checkout objects.  But each checkout is tied to an account_id, so from that account_id, we can backtrack to get the user and then get the access token to issue the refund.

.. note::
    While both parameters are optional, you must pass one or the other

You can include more information if you want in the response.  In the future, we plan on being able to optimize the requests we make to the WePay API.  The more data we receive from your internal database the more information we can render immediately without needing to make additional requests which can slow down performance.

Payer Resource
~~~~~~~~~~~~~~~~~~~~
The payer reosurce should be accessed via the *(middleware)/payer* endpoint.

.. http:post:: (middleware)/payer
    
    Get a list of checkouts for a payer given the passed search parameters

    :reqheader Authorization:   shared-secret key between your middleware and Kvasir
    :reqheader Content-Type:    application/json

    :form payer_email:  the payer's email address

    :>json payer_checkouts:     a list of all checkouts that the given payer has made.  Each checkout is a JSON object
    :>jsonarr checkout_id:      checkout_id of a given checkout
    :>jsonarr account_id:       the account_id for which the checkout was made
    :>jsonarr create_time:      *(optional)* the time at which the checkout occurred
    :>jsonarr credit_card_id:   *(optional)* the tokenized id of the card used to make the payment
    :>jsonarr amount:           *(optional)* the amount paid

The checkouts contained in *payer_checkouts* are very particular about the information they need to include.  Again, you can include more information, but this is the **minimum** information.

The response is meant to look like what the WePay API sends back in its :wepay:`checkout` endpoint.  It's a subset of the data, but the naming convention is the same and that's intentional in order to keep some level of consistency between the two.

Error Reporting
~~~~~~~~~~~~~~~~~~~
In the event of an error, you should return an error message back to Kvasir.  That way we can pass that error to the end user to notify them of what happened.

Kvasir does not try and standardize the error messages, but it does expect errors to be reported in a standard format.

This is an example of an error message for when a user cannot be found:
    .. code-block:: javascript

        {
            "error": "user not found",
            "error_message": "Cannot find user that matches search parameters"
        }

Kvasir expects two fields in any error message package:
    - *error*:  a technical description of the error
    - *error_message*: the error message that is displayed to the end user

When Kvasir receives a package, it first checks to see if the "error" field is present in the response.  If that field is present, then it will send the error to the front-end and let it display it to the end user.  It uses whatever string you place in "error_message".

The reason that Kvasir doesn't try and standardize the error messages is because depending on how you build you middleware, there could be a number of places where an error could occur.  If searching for an access_token takes you across three different tables, then you may want to let the end user know which table caused the error.

You can include more information in your error packages if you want.  Kvasir will log the entire package in it's logs, so it may be beneficial to include more information, but make sure to do it in a field other than "error" or "error_message".  The middleware we developed during this process included additional information in the "error_description" field.  It included an low level exception information that occurred in our Python middleware which gave us more visibility as we developed.  Again, it is up to each platform to decide what they want to include.  You own the middleware and should use error messages and logging in a way that makes the most sense for your team.

What If I don't have all this data?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Certain fields are marked as optional in the response.  These fields are very, very nice to have as they will make it easier for your support teams; however, we understand that you may not have that data.  Optional fields can be left off.

If the field is not marked with *(optional)*, the it is a required field for Kvasir to function properly.  Any kind of *id* field, such as checkout_id and account_id are required, because these are what allow us to jump between WePay endpoints to receive information.

If you do not have a required field, you will likely need to add it into your database.  You can likely do that by making requests to the WePay API with the limited information that you have and expanding your tables to include new information.

Our development database actually includes the WePay responses as blobs in a column.  We pulled out data that we wanted to be able to index and search on (like emails, account_ids, account names and checkout_ids) and gave them dedicated columns.  While this increases the size of your database, it does give you all of the information regarding actions completed on your platform.  Not all of the information contained in the WePay API responses are completely necessary, but they could become useful at some point.  Simply storing the original responses as blobs gives you the opportunity to pull them out and get more detailed information when appropriate.

