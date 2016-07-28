.. _kvasirarch:

Kvasir's Architecture
=========================
This page details Kvasir's architecture.  It explains in detail why each architecture decision was made.

A Brief History
-------------------
Originally when the specifications for the project were laid out, it appeared as though Kvasir could be a single page app (SPA).
By using a framework/library such as AngularJS or ReactJS, we could provide a SPA that people could simply place onto a simple static web server.  The SPA would have all of the hookups to the WePay API and be able to make all required calls from JavaScript.

While it sounded nice in theory, we quickly realized it was not so nice in practice.  There were two major considerations that prevented us from building a complete SPA - security and data access.

On the security side, many of the WePay API calls that we needed to make required a user's access token.  Exposing that access token to the front end browser is not inherently in-secure, but there were too many, "Well what happens if..." questions for us to fell comfortable exposing access tokens in their raw form to the browser.  Without these access tokens, we can't make many calls to the WePay API directly from the browser.

While exposing access tokens to the front end was considered a deal breaker, being able to get tokens to the front end in the first place was also a challenge.  No two database configurations are the same, and we wanted this solution to be available to any company that currently integrates with WePay.  Normally, data makes up the fundamental building block of a web-application, but here we were presented with the unusual problem of having absolutely no control over the underlying database.  Not only that, but many databases would likely not be optimized for use with Kvasir, so we could make no assumptions about how certain pieces of data were connected or about the presence of data.

A pure SPA with no attached backend fell of the table pretty quickly, but we wanted to try and hold on to many of the benefits that come with a SPA such as:
    1) **Being back end agnostic**.  Someone could simply take our front end, and redesign the lower pieces and it should work just as well (if not better)
    2) **Easy setup and deployment**.  One of the nice parts of an SPA is that all of the logic and external calls are contained in the app running in a user's browser.  It only requires a small static server to push the necessary files forward, but the burden of the work falls on the user's machine.


Architecture
-----------------
With all of these considerations in mind, we decided to stick with an SPA but provide it a sturdy backend server for managing external API calls and database connections.

.. figure:: images/KvasirInitialArchitecture_Prototype.*
    :align: center

.. note::
    The color of the lines is not extremely important, but the idea is that information moves along that path from green, to yellow to red.

As you can see, the idea is that a user interacts with Kvasir's front-end component (no surprises there) which then communicates with our back-end for additional information. 

Certain actions will fire off commands to the back-end server, which will typically do two tasks in order to complete a user request:
    1) get essential information (such as access tokens) from a database that exists outside of Kvasir
    2) take that information and make WePay API calls to gather more information

After completing those two tasks, the back-end sends the data to the front-end component which formats it and renders it to the user.  This is pretty much the standard approach to any web-based application.  The tricky part is getting that initial information from the database.

In order to achieve this, we came up with this idea of a "middleware component."  This is a layer that is provided by a developer trying to use Kvasir that gives Kvasir access to the information that it needs.

This middleware can be provided in any language that the developer chooses, using any structure that they want.  As long as it can receive and send back information in the way that Kvasir expects, the rest is up to the developer.  The information that Kvasir requests may be spread out across three or four tables for one developer, but be completed contained in a single table for another.  This middleware piece allows Kvasir to be apathetic towards a developer's underlying database.  This provides us with the necessary flexibility to be able to provide this as a solution to all company's currently using WePay, not just a handful.


Integrating with Kvasir
----------------------------
The entire architectural model assumes that this application is running on an company's internal network.  It does not come with any sort of authentication and there are no plans for it.  Similarly to database configurations there are a plethora of authentication systems out there that we cannot provide mechanisms to interact with all of them.

You should launch Kvasir on system that is only accessible to your employees and not the greater Internet.  Otherwise, you will be exposing your database, and all of the information about your end users.