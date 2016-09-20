# Kvasir
Kvasir (Vas-eer) is a support dashboard meant for WePay partners to be able to provide their end-users with basic support.  
It will perform:

    - Account Lookups
        - Get the status of a merchant's account
        - Get a merchant's withdrawal info including their bank info and when the next withdrawal will take place
    - Merchant (User) Lookups
    - Resending merchant confirmation
    - Refunding Checkouts
        - Both full and partial refunds are possible
    - Payment Method Lookups
        - Get the information that a given *payment_method_id* represents

## Full Documentation
This README only contains a brief outline of what Kvasir is and what it is capable of.  To view the whole documentation, head to http://jalepeno112.github.io/Kvasir/index.html

## Functionality
All of the functionality has been tested, but there may be some cases that we missed.  The WePay API isn't always predictable, so if you run into an error, be sure to report it as an issue so that we can investigate further.  Giving me the original call information (without your client_secret or any access tokens as those are sensitive pieces of information you shouldn't share with anyone) is extremely helpful so that I can try and reproduce the error.

To see how the framework behaves in action go to: https://nameless-hollows-55554.herokuapp.com/

## Test Cases
The test cases are found in the "test" directory.  They test the backend functionality and Kvasir's ability to interact with your middleware.

## Why Kvasir?
Kvasir is a Norse god of wisdom <http://norse-mythology.org/kvasir/>.  He was killed by dwarves and his blood became the Mead of Poetry which was used to inspire poets and scholars.  Basically, he's the personification of alcohol.  Given that we were drinking when we came up with the idea for Kvasir, it only made sense.

## Who is this mystical "we" all over the documentation?
We are many, but we are one.

## License
Copyright 2016 Giovanni Briggs

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

