# Kvasir
Kvasir (Vas-eer) is a support dashboard meant for WePay partners to be able to provide their end-users with basic support.  
It will perform:

    - account lookups
        - Get the status of a merchant's account

        - Get a merchant's withdrawal info including their bank info and when the next withdrawal will take place

    - user lookups

    - resending user confirmation

    - refunding checkouts

        - Both full and partial refunds are possible

## Functionality
All of the functionality has been tested, but there may be some cases that I missed.  The WePay API isn't always predicatable, so if you run into an error, be sure to report it as an issue so that I can investigate furhter.  Giving me the original call information (without your client_secret or any access tokens) is extremely helpful so that I can try and reproduce the error.

To see how the framework behaves in action go to: https://nameless-hollows-55554.herokuapp.com/

## More Info
To see more info and the full documentation on Kvasir's specs and what's required to use Kvasir, checkout the full documentation: https://wedemoapp.gitlab.io/kvasir/index.html

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

