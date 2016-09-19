.. _kvasirfrontend:

The Front End: ReactJS and Redux
=====================================
After :ref:`completing the architecture <kvasirarch>` we began to look at what technologies were available to help us meet our end goal.  Again, we wanted to retain many of the benefits that come with a single page app (SPA) so we began looking at the available SPA frameworks and libraries.

We saw the user-interface being composed of a set of components.  Each componenet had a tie to another component, and an update to the first component would impact the second, but not necessarily all other components.  For example, searching a user should impact the information displayed about that user (the *user component*) and the since the available account information stems from the user, then this action should also affect what account information is displayed.  Selecting a particular account would allow us to render *checkout* information about that account, but it shouldn't impact the account component itself or the user component.  I can change between a merchant's accounts and load the related checkouts for each account without having to reload the entire page.

Essentially, our application should allow a user to walk through their internal database, in combination with WePay lookup calls and other actions, to gather information about a particular merchant or payer and complete tasks for them.

`ReactJS <https://facebook.github.io/react/>`_ gives us exactly what we were looking for.  The entire philosophy behind React is the idea that a user interface should be composed of a set of independent components.  In our initial prototypes, we had trouble passing around information between components. `Redux <http://redux.js.org/>`_ solved the problem for us by making it easier to share information across the application.  We likely could have developed everything purely in React, but Redux made it easier to get off the ground.

Actions, Components, and Reducers
---------------------------------------
React and Redux apps are comprised of 3 parts:
    - Actions
        * events that should manipulate the state of the application in some way
        * also responsible for making POST requests to the back-end and dispatching other actions as a result of those requests
    - Reducers
        * given an action, manipulate the state of the application
    - Components
        * the front-end blocks of dynamic HTML
        * Take information from different parts of the Redux state object to render on the page.

Holding onto the idea that our application is really taking a user on a walk through their internal database, we have a set of "objects" or "models", each of which have their own set of actions, reducers and components.

These objects are:
    - :ref:`User <user_object>`
        * represents a given *merchant*.  
        * A merchant can have multiple accounts.
    
    - :ref:`Accounts <account_object>`
        * represents a merchant account
        * One account can belong to multiple users, but this is not common

    - :ref:`Checkouts <checkouts_object>`
        * represents the checkouts tied to a given merchant account (Accounts object)
        * Accounts should have multiple checkouts, but each checkout only belongs to one account.

    - :ref:`Withdrawals <withdrawal_object>`
        * represents the withdrawals tied to a given merchant account
        * this includes the reserves that an account has

    - :ref:`Credit Card <credit_card_object>`
        * represents the credit card information associated with a given tokenized credit card ID used for a checkout
        * Tokenized cards can be used for multiple checkouts on the same app, but the information tied to a tokenized card does not change from checkout to checkout

    - :ref:`Payer <payer_object>`
        * represents a payer who made a purchase on the platform

If you look at these objects, you might recognize that all of these *except for the Payer object* directly tie back to a WePay API endpoint.  That's intentional.  We assumed that many platforms would have developed their database configurations around the different WePay endpoints.  Since you generally have to interact with these endpoints in a certain order (/user endpoint, then /account endpoint, then /checkout endpoint), it makes sense that a partner's database would grow around that.  Regardless of how a your database is configured, Kvasir needs to interact with each of these endpoints to gather the information it needs.

.. note::
    The front-end objects do not make any calls directly to the WePay API.  All of those are done by the back-end server.

The *components* are responsible for handling user actions and then dispatching the associated Redux actions.  They are also responsible for subscribing to all of the necessary state information and formatting that data.  While all actions are globally published, not every component relies on all of that info (and they shouldn't).

For example, when an account is clicked in the account component, the account component registers that the click happened, manipulates the table, and then dispatches the *searchedAccounts*, *fetchWithdrawalsIfNeeded* and *fetchCheckoutsIfNeeded* actions.  Some of these actions will directly impact the action component causing it to re-render with new info, while others will impact other components forcing them to re-render with new info as well.  On the other hand, the *User* objects is not impacted at all.  Actions to accounts do not affect the User who owns them so we do not see the user component re-render.

General Object Implementation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
All of the objects are different in the sense that they require different search requirements (user_id, account_id, etc.); however, they are all implemented in very similar ways.  

Actions
^^^^^^^^^^
All of the objects require a handful of actions:
    1) Search
        - Notify all components the object is being *searched* for and what exactly we are searching for
    
    2) Request
        - notify all components that the resource is being *requested*
        - make POST request to back-end for more information (which subsequently makes a call to the WePay API and the middleware if necessary)
    
    3) Receive
        a) If the POST request completes successfully, then we notify all components that new information has been received
        b) Error
            - If the POST request did complete successfully, then we notify all components of the error
    
    4) Clear
        - Notify all components that we are starting over and need to clear any previously held information because it is no longer valid

But not all of these actions are directly accessible.  For example, request and receive are always bundled together.

In general, these are the public functions that each object has for dispatching actions:
    1) .. function:: search(id)
        
        Will cause the associated reducer to update its state with the information the user passed in order to search the object. This is necessary so that we can verify that the info coming back is actually the info we requested.
        
        :param id:  some unique id of the object that we just looked up.  For example, for user's this is an email address; accounts use an account_id

    2) .. function:: fetchIfNeeded(id)
        
        First checks to make sure that we have all the information that we need in order to fetch information.
        Then calls the ``fetch()`` function which will make the call to the back-end for more info.
        This will result in the dispatching of the *request* action along with *receive* or *error* depending on the result

        :param id:  some unique id of the object that we just looked up.  For example, for user's this is an email address; accounts use an account_id

Reducers
^^^^^^^^^^^^
The reducers that take these actions are also very similar.  
Each reducer is actually composed of two smaller functions - a *searched* function and a *base* function. 
We do this because of the asynchronous nature of Redux actions mixed with the POST requests to our back-end.  If someone searches a user, but then realizes they searched the wrong email and changes the search parameter, we need a way to handle that.

These two functions are:
    1) .. function:: searched(state =defaultState, action)
        
        When a search action fires, update the object's state with the information we used to search (account_id, user's email, etc).
    
        :param state:   The current state of searches made for the object.  The initial state is an empty object because we haven't looked anything up yet
        :param action:  the action that was fired and contains information about the search
    
    2) .. function:: base(state=defaultState, action)
        
        For all other actions other than searching, they are sent to the base reducer.
        Responsibly for modifying the information that we maintain for a given searched object
        The initial state is defined by each object but generally they all look this:
           
            >>> defaultState = {
            >>>    isFetching: false,
            >>>    info: []
            >>> }
        
        - *isFetching* tells us if we are waiting for a response
        - *info* is where the response data is stored

        :param state:   the current state of the object.  This includes the information that we requested from the Kvasir's back-end.
        :param action:  the action that was fired that contains information about the object

Going back to the earlier example, if someone were to search a user with one email and immediately change the search parameters, there is no way for them to cancel the original request.  It has likely already been sent to the back-end to be processed.  There is also no guarantee that the first request will finish before the second request.  So, the user may be handed information from the original request, despite the fact that they didn't want to.  Separating the search information from the object's information that we receive allows Kvasir to validate that the information we received is actually the info we wanted.  If it's not, we can ignore it and prevent the state from being updated with unwanted info.

.. _user_object:

User Object
------------
The user objects represents a WePay merchant accessible through the :wepay:`user` endpoint.
This is the primary building block for all other information that we gather.

To gather most information via the WePay API, you need to know the merchant's access token.  This has to be stored in the platform's database, and is likely tied to the merchant's login credentials (such as their email).  So given a merchant's email, we can find their access token in the partner database, and then get their information from the WePay API.

.. note::
    The back-end server also supports the ability to find a merchant's access token by the account_id as this is sometimes a more readily available key then the merchant's user_id or email.

The user's information is displayed in a table with a single row that lists:
    - Email
    - First Name
    - Last Name
    - State
    - User Id

The state of the user is important because if the user is not in the *registered* state, then they have not yet confirmed their email on WePay.  It is possible that the confirmation email is lost in the merchant's inbox, so Kvasir provides the functionality to resend the confirmation if the user is not *registered*.

.. _account_object:

Account Object
----------------
As soon we have a user's access token, we can also get a list of all of their merchant accounts tied to the app_id that the access token is associated with via the :wepay:`account find` call.

A user could have multiple accounts, so each account is displayed as a row in a larger table. Clicking on a row of the table will cause the row to become highlighted, and will dispatch actions to fetch more information about that specific account.  This information includes withdrawals, reserves, and checkouts.

The account table itself includes:
    - Account Name
        * name of the account

    - Account Id
        * accounts unique id

    - Balance
        * how much the account currently has sitting in it.
        * **Note** this is not the lifetime balance of the account

    - Bank
        * If the user has completed KYC, then this is name and last four digits of their bank account

.. _withdrawal_object:

Withdrawal Object
------------------
The withdrawal object represents information gained from the :wepay:`withdrawal` endpoint. 
This includes information about where a merchant's money is being withdrawn too, when it's being withdrawn, and how much is being withdrawn.

It also manages another table detailing the reserves associated with an account if applicable. They are in two different tables, but once you have enough information to get withdrawals, you have enough to get reserves, and they are closely related enough that gathering both at the same time makes sense.

These tables will render the 50 most recent withdrawals/reserves for a merchant.  The actions to gather this information are generally dispatched after an account is selected.  They can be dispatched sooner, but withdrawals are tied to a specific account, so you need both an access_token and an account_id to complete the request.

.. _checkouts_object:

Checkouts Object
------------------
The checkout object is one of the more intensive objects.  Since it is the heart of many operations that a platform performs, there are also several actions tied to any given checkout.

The checkout component renders a table of information gathered from a :wepay:`checkout find` call which includes:
    - Checkout ID
    - Date
    - Descriptor
    - Amount
    - Gross Amount
        * the amount + any additional fees that the *payer* had to pay
        * this is an important distinction because fees can be assigned to the payer, payee, or even the app itself
    - Payer Email
    - Payer Name
    - Payment Method ID

The last column of the checkouts table is the *Refund* column.  Here, a user has the ability to issue a full or partial refund for a given checkout.  Clicking the refund button will cause a modal/overlay to appear.  The user enters in how much they want to refund and the reason for the refund.

Once the refund has been submitted, the checkout object will re-fetch the information about that checkout from the WePay API and update the appropriate row.  This gives a user instant verification that the refund went through successfully.  As soon as all funds have been refunded, the refund button disappears.

.. note::
    Refunds can fail for several reasons.  These errors are displayed in the overlay, but do not prevent the user from retrying.

The checkout action and reducer files contain all of the logic for handling refunds, which could likely be separated completely if we wanted to.  However, since a refund requires so much information from the associated checkout, and the visual components are tightly coupled, it made sense to keep them together.

The checkout component is also currently responsible for rendering the information for the :ref:`payer object <payer_object>`.  The two are closely related, and we were able to leverage the checkout's layout for the :ref:`payer object <payer_object>`.

.. note::
    This will likely change in the future.  It made sense at the time, but the payer object has grown into much more than originally intended. 

.. _credit_card_object:

Credit Card Object
--------------------
The credit_card object represents information gathered by a :wepay:`credit_card` call.  One of the benefits of WePay is the ability to tokenize payment information and simply store a token instead of all the payer's info.  Storing all payer info requires a higher level of PCI compliance than just the token.

However, a platform may want to lookup information associated with a tokenized card at any point in time.  The *Payment Method ID* column in the checkout object contains the tokenized id.  Clicking on one of them (they are all hyperlinks) will dispatch actions to fetch more information about the card and render it in a table.

This table includes:
    - Credit Card Id
    - Create Time
    - Card Name
        * The type of card and the last four digits of the card

    - Owner Name
        * Name of the owner of the card

    - Expiration Date

.. _payer_object:

Payer Object
-------------------
As mentioned earlier the Payer object is the only one that doesn't tie directly back to a WePay endpoint.  This is because the WePay API does not provide any way to search by a payer's information.  All you can search by is a tokenized credit card ID.

However, if a payer comes to a platform's customer support and requests a refund, they likely don't know the token associated with their purchase.  Storing payer information falls squarely onto the platform.

The payer object follows the same design as all the other objects, however, it's associated back-end call does not communicate with WePay.  Instead, it communicates with the partner's database to receive **all** checkouts associated with the user.

We then display:
    - Checkout ID
    - Date
    - Amount
    - Account ID

This is all the information that our back-end expects from the middleware.
Selecting a checkout here will then dispatch actions to gather information about the merchant and the associated account.  A platform can't do a refund without the merchant's access token, so the account_id serves as a way for us to request that info from the partner's middleware.

Once a checkout has been selected though, it will also dispatch an action to find more information on the WePay API about *that specific checkout*.  The payer table that had all of the payer's checkout on that platform, potentially across multiple accounts, will become a single row with all of the information that you would normally get from the checkout object, but only for this particular checkout.

Again, the idea behind this application is to take a walk through the platform's database in conjunction with information stored by WePay.  No matter what path you take, you should be able to arrive at your destination and it should look familiar to all other paths.




