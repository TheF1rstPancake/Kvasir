Deploying to Heroku
====================
This page explains the process we took to deploy Kvasir on Heroku.  
You can follow a similar approach for any third party hosting service but some of the particulars will be dependent on which service you chose to use.

Purpose
--------
The point of deploying on Heroku was to validate that our system could easily be deployed.  We wanted to make sure that all modules were included in our `package.json` file and that Kvasir could function outside the comfort of our development environment.

Our first attempt was less than glamorous.  There were a lot of changes made in order to get the deployment to work, but we ended up with a better system overall.
The idea for using environment variables instead of a configuration file came from this process.

Following the Tutorial
--------------------------
We are not the first people to deploy a NodeJS application to Heroku.  Not even close. 

There is a very good tutorial for `deploying a NodeJS app on Heroku <https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction>`_.
This document will be more notes on the pitfalls that we encountered specific to Kvasir and what steps we took to climb out of them.

Procfile
~~~~~~~~~
The Heroku tutorial mentions that you can use a Procfile to specify how to launch the application; however, Heroku will also try and run commands present in the `scripts` section of the `package.json` file.  Kvasir includes the commands for how to start the NodeJS server and build the front-end JavaScript library in the `package.json` file, so the Procfile is not necessary.

Setting Environment Variables
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Heroku will only launch with files include in the git repository that you push to it.  Assuming that you didn't make any changes to Kvasir's `.gitignore` file, then the `.env` file that includes all of the environment variable configuration, but is hidden from git, will not be included in the source code uploaded to Heroku.  This presents a problem because Kvasir needs those configuration values, but the file that you put them in is no longer accessible.

The solution is to set environment variables on the Heroku server.

Depending on what version of Heroku toolbelt that you have installed on your machine you will use either `heroku config:add` or `heroku config:set` followed by the name of the environment variable and it's corresponding value.

For example, to set the cookie secret:
    >>> herkou config:set KVASIR_COOKIE_SECRET=YOUR_COOKIE_SECRET

You have to run this for each environment variable that you want to set, and the Heroku server will restart for each variable that is added or changed.

Scripting Makes Life Easier
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
If you already have a `.env` file defined (which you generally should during development), then you can use this Python script to set all of the environment variables on Heroku for you.

    ..code-block:: python

        from subprocess import call

        command = ['heroku', 'config:set', '']
        with open(".env", "r") as f:
            for line in f:
                command[-1] = line.rstrip().replace(" ", '')
                call(command)

What this script does is open the `.env` file, and then for each line in that file, it will strip any trailing whitespace (including new lines) and remove any spaces from the line and send the command via the command line to heroku to add the environment variable and value.

The reason we have to remove any spaces is because spaces will mess up how the command line parses the command.  If your `KVASIR_MIDDLEWARE_URI` has spaces in it, make sure you replace those with *%20*.

