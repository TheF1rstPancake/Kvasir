.. Kvasir documentation master file, created by
   sphinx-quickstart on Wed Jul 27 13:59:12 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Kvasir's documentation!
==================================
Kvasir (Vas-eer) is a support dashboard built for WePay partner's to use with their customer support teams.  
It provides most of the essential functionality that a support teams needs to handle the various actions that merchants and payers need.

.. note::
    This documentation was added to GitLab pages and GitHub pages by following this tutorial:
        http://lucasbardella.com/blog/2010/02/hosting-your-sphinx-docs-in-github

    Getting it to work for GitLab pages required some changes and help from the following link:
        https://about.gitlab.com/2016/04/07/gitlab-pages-setup/
        

Kvasir's Capabilities
---------------------
Kvasir is designed to aid in the completion of many actions that your typical customer support user would have to do after integrating with WePay.

These actions include:
    - User Lookups
        * Gathering information about a particular merchant
        * Resending email confirmation to them
    - Account Lookups
        * Gathering information about a particular merchant account
        * This allows you to quickly identify any pending actions that a user needs to complete on their end
    - Refunds
        * Perform a refund (both full and partial)
    - Withdrawal Lookups
        * Gather information about where a merchant's funds have been withdrawn to and when the next withdrawal should take place
        * This also includes being able to get reserve details for accounts that have money in reserve
    - Credit Card Token Lookup
        * Given a tokenized credit card, Kvasir can gather the original information used to create the token

Tech Stack
-----------
Kvasir is comprised of two major components - a back-end server running on `NodeJS <http://https://nodejs.org/en/>`_ and a set of front-end JavaScript files built on top of `ReactJS <https://facebook.github.io/react/>`_ and `Redux <http://redux.js.org/>`_.

You are free to pick and choose what parts of the application you want to use.  ReactJS is designed to be back-end agnostic - it doesn't care what technology you use on the back-end, as long as it receives the information it needs and in the format that it expects.  You could chose to scrape the NodeJS server and rebuild it in your own language of choice.  The reverse is true as well - if you want to work your support dashboard within an existing infrastructure, then you can throw away the front-end component and build your own on top of our NodeJS server.

In order to be fully functional, Kvasir requires a connection to your database.  
Since no two database configurations are the same, there is no realistic way for Kvasir to come with a way to pull information from every possible configuration.  

The solution is to have you (the dear developer) :ref:`create a middleware component <kvasirmiddleware>` that connects Kvasir to your database.  Kvasir asks for very specific information in a very specific format and expects data to be returned in similarly specific format.  This allows Kvasir to pull data from your database and make corresponding WePay API calls to gather more information.  The benefit is that you likely do not have to change your database configuration to work with Kvasir, but rather, you make up for shortcomings programmaticly in the middleware.

It is **recommended** that you keep the front and back-end components together.  
NodeJS comes with some nice functions that make compiling our front-end JavaScript much easier.
However, you are free to take the application apart and use just Kvasir's NodeJS server for communication and data-fetching and build your own front-end on top of that, or leave the front end in one piece and rebuild our back-end in a way that is more to your liking.

Installation
---------------
First make sure that you have `NodeJS <https://nodejs.org/en/download/>`_ installed on your machine.  Node comes prepackaged with it's package manager `npm <https://www.npmjs.com/>`_ which will allow you to download and manage all of the packages and dependencies.

From within the main application directory run:
    >>> npm install

This will install all necessary packages and dependencies.

We are also assuming that this application is being installed on your company's internal network.  Kvasir's :ref:`entire architecture <kvasirarch>` is built around the idea that it is only visible to your employees and not the greater internet. 

Before you can launch the server though, there are :ref:`several other configuration <serverconfiguration>` steps that you have to complete.


Contents
------------

.. toctree::
   :maxdepth: 2
   
   architecture
   frontend
   backend
   middleware
   usecases
   testing
   herokudeploy
   googleappengine

Indices and tables
====================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

