"""
Blueprint for handeling connection to Kvasir support dashboard.
"""
from flask import request, url_for, Blueprint, jsonify, Flask
import json

# import wraps to create a decorator
from functools import wraps

class KvasirBlueprint(Blueprint):
    """
    Subclass of the flask Blueprint class for connecting to the Kvasir support dashboard.

    This gives Kvasir access to some of our data. We get to chose what data.  We know that it's Kvasir requesting the data based on a shared secret key.  That key should be generated and shared between the two applications but to no one else.
    """
    def __init__(self, *args, **kwargs):
        super(KvasirBlueprint, self).__init__(*args, **kwargs)


        # load our test json file and store it in memory
        with open("test.json", 'r') as f:
            self.database = json.load(f)
        self.middleware_secret = self.database['secret_key']

    def _returnError(self, resource, data):
        error_package = data;
        error_package['error'] = "error"
        return jsonify(error_package)

    def _getUserFromAccountId(self, account_id):
        account = self.database['Accounts'].get(str(account_id))
        if account:
            return account['username']
        return None

    def _getAccessTokenFromUser(self, data):
        print("Getting access_token from user")
        if "account_owner_email" in data:
            user = self.database['Users'].get(data['account_owner_email'])
            if user:
                return jsonify(user)
        elif "account_id" in data:
            account = self.database['Accounts'].get(data['account_id'])
            if not account:
                self._returnError("user", {"error_message": "could not find account with id: {0}".format(data.get('account_id'))})
            user = self.database['Users'].get(account['username'])
            if user:
                return jsonify(user)
        return self._returnError("user", {"error_message":"could not locate resource with {0}".format(data)})
    def _getPayerCheckouts(self, data):
        """
        given a payer email get a list of all of their checkouts

        TODO: make this timebased.  Payer must provide their email and the date that the charge occured.  We can search for +/- a day around the date they provide
        """
        print("Checking checkouts with payer: {0}".format(data['payer_email']))
        checkouts = [v for k,v in self.database['Checkouts'].items() if v['payer_email'] == data['payer_email']]

        print("Found checkouts: {0}".format(checkouts))

        formatted_checkouts = [{
            "checkout_id":  c['checkout_id'],
            "create_time":  c.get('create_time', c['data']['create_time']),
            "amount":       c['data']['amount'],
            "account_id":   c['account_id'],
            "credit_card_id": c['data']['payment_method']['credit_card']['id']
        } for c in checkouts]
        return jsonify({"payer_checkouts":formatted_checkouts})

# initiate a new KvasirBlueprint
kvasir_middleware = KvasirBlueprint("kvasir_middleware", __name__)

def checkSecret(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        """
        Verify that the request sent to us has the right secret key
        """
        print("Checking authorization header...")
        sent_secret = request.headers.get("Authorization", None)
        if not sent_secret or sent_secret != kvasir_middleware.middleware_secret:
            response =  jsonify({"error":"error", "error_message":"Authorization denied"})
            response.status_code = 403
            return response
        print("Authorization cleared!")
        return f(*args, **kwargs)
    return decorator



@kvasir_middleware.route("/<resource>", methods=['POST'])
@checkSecret
def KvasirMiddleware(resource):
    print("Received request: {0}, {1}".format(resource, request.json))
    data = request.json

    if resource == "user":
        return kvasir_middleware._getAccessTokenFromUser(data)
    elif resource == "payer":
        return kvasir_middleware._getPayerCheckouts(data)
    else:
        print("ERROR:\tDid not recognize resource: {0}".format(resource))
        return kvasir_middleware._returnError(resource, data)

app = Flask(__name__)

app.register_blueprint(kvasir_middleware)

def Launch():
    app.run()
    print("CLOSING KVASIR MIDDLEWARE")

if __name__ == "__main__":
    Launch()
