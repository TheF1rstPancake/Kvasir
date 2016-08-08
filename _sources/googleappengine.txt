Deploying to Google App Engine
==================================

:ref:`Deploying to heroku <herokudeploy>` is one way to host Kvasir on a third party hosting service, but Heroku isn't everyone's first choice.  

Many people also chose to use the `Google App Engine <https://cloud.google.com/appengine/docs>`_ for deploying their applications.  The Google App Engine (GAE) handles a lot of production level concerns for you, such as scaling and health monitoring.  The nice part about the GAE is that you can configure your applications with a simple YAML file to define a lot of behaviors and gain a lot of extra functionality without putting in a lot of work.

This document explains the steps we took to deploy Kvasir to the GAE.

Google App Engine and NodeJS
--------------------------------
Originally, the Google App Engine only support Python, Java, PHP and Go, but they have begun to support many other popular languages and web frameworks including NodeJS.  NodeJS is still considered in "beta" for the Google App Engine, but we were able to deploy it without a lot of problems.

One issue to identify right off the bat is that NodeJS requires what the GAE refers to as a "Flexible" environment.  All this really means is that the GAE will launch your NodeJS application using Docker containers on the `Google Compute Engine <https://cloud.google.com/compute/>`_.  This is important because the `pricing <https://cloud.google.com/appengine/pricing>`_ for the GAE and the Google Compute Engine are different.

The cost is not too high.  During our development period, we only had about $100 a month in charges, but the pricing will vary greatly depending on how often you use the system.

Setting up Google App Engine
--------------------------------
Setting up the Google App Engine is well documented process.

You can follow this tutorial here to get your feet wet:
    https://cloud.google.com/nodejs/getting-started/hello-world

.. note::
    We reiterate many of those steps here, but not all of the steps in that link are necessary for our deployment.

Step One: Install Google Cloud SDK
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Step one to any Google App Engine project is to install the Google Cloud SDK.

The installation can be found here:
    https://cloud.google.com/sdk/docs/

Step Two: Start a Project and Enable Billing
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The second step is to actually create a project and set up your billing information on it.

To create a project:
    https://console.cloud.google.com/project

After creating your project, you'll want to take down the *Project ID*.  We will need this for several upcoming steps.

To enable billing:
    https://support.google.com/cloud/answer/6293499#enable-billing

Step Three: Define app.yaml
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The magic of the Google App Engine comes in the *app.yaml* file that it uses to set up and configure your environment.  Google's documentation is a little confused on what `is and isn't allowed <https://cloud.google.com/appengine/docs/flexible/nodejs/configuring-your-app-with-app-yaml>`_ in the *app.yaml* file for a NodeJS application.  For example, that document says that the *login* setting is not allowed for NodeJS apps, but we successfully deployed with it.

.. note::
    Your app.yaml file **must** be placed in the root directory of your code.
    So after you download Kvasir, it goes right in that directory at the same level as *server.js* and *package.json*

Our app.yaml file looks like this:

    .. code-block:: yaml

        # configuration file for GAE with NodeJS
        # 

        runtime: nodejs
        vm: true
        threadsafe: true
        service: kvasir

        vm_health_check:
            enable_health_check: False

        handlers:
         - url: /.*
           script: server.js
           secure: always
           login: admin

In this file, we tell the GAE that we want to use nodejs, and we are using a flexible environment (*vm: true*).  We also specify a *service* name.  The GAE readily supports a `microservice architecture <https://cloud.google.com/appengine/docs/python/microservices-on-app-engine>`_ which we can use to our advantage.  Even if this is the only service deployed on your application, that's fine.  Giving it a name makes future updates easier.

Under the *handlers* section we tell the GAE where to send relevant traffic.  We want all traffic to go to our *server.js* server, and all requests should be done with HTTPS and all requests need to have a login associated with them.

The *login* component here is key.  There are a few different login options but *login: admin* means that only people registered with your application are allowed entry.  **This allows you to setup authentication with Google outside of Kvasir.**  All users who enter the application are first vetted by the GAE and only authorized users are allowed entrance into the actual application.

You can tweak and add more settings to your application as you see fit.

.. warning::
    The NodeJS "login" option is still in beta so we may have launched during a time where this was allowed, but it could be removed at a later point.  Still, it seems likely that Google will chose to give all possible environments the opportunity to use a form of login.

Step Four: Add Users
~~~~~~~~~~~~~~~~~~~~~~~~
You can invite users using their Google emails under the *IAM & Admin* section in your app's console.

In order for them to be considered *admin* they only need to have *Viewer* privileges.  You do not need to make everyone who needs access to Kvasir an owner of the entire GAE project.  This allows you to maintain access control over the workings of the GAE project but still give everyone access to Kvasir.

Step Five: Deploy
~~~~~~~~~~~~~~~~~~~~~~~~~~~
Deploying the application can be a little messy, but the general idea with Docker containers is that, if it runs in your local environment, it should run just fine in the deployed environment.

The main issues we had with deploying were with the *package.json* file.  Some of our packages had been installed locally but were not contained in the *package.json* file, so not all packages were installed and the application could not start.

To deploy the application, you must run the following command from the root directory of Kvasir:
    >>> gcloud app deploy --project=<YOUR_PROJECT_NAME>

.. note::
    You can also specify a version by adding *--version=<YOUR_VERSION>*.  During our development, we kept two versions, *dev* and *master*.  But this is optional.  If you do not include a version GAE will default to using the date and time of deployment as the version name.

After deploying, you will see a lot of text on your screen as the Docker container downloads its environment and installs the application.  Deploying took us anywhere from 5-10 minutes.  Once the console says that deployment is done, you can go to the link for your project and you should be live!

Adding Your Middleware to GAE
---------------------------------
Our Kvasir middleware is actually contained on the Google App Engine as another service following Google's `microservice architecture <https://cloud.google.com/appengine/docs/python/microservices-on-app-engine>`_.  This way the entire application is nicely housed in one environment.

We wrote our middleware in Python, but you would basically follow the same steps as above, but just for the language that you wrote your middleware in.

This is the recommended approach.  Because NodeJS is still in Beta, using an already fully supported language such as Python, Java, PHP or Go seems to give you more functionality.  However, it is up to you to decide where everything will live.