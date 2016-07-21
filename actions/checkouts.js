import {addError, clearError} from "./errors"

export const REQUEST = 'REQUEST_CHECKOUTS'
export const RECEIVE = 'RECEIVE_CHECKOUTS'
export const SEARCH = 'SEARCH_CHECKOUTS'
export const INVALIDATE = 'INVALIDATE_CHECKOUTS'
export const REFUND = "REFUND_CHECKOUT"
export const RECEIVE_REFUND = "RECEIVE_REFUND_CHECKOUT"
export const CLEAR_REFUND = "CLEAR_REFUND_STATE"

export function searchCheckout(email, account_id = null, checkout_id=null) {
    return {
        type: SEARCH,
        email:email,
        checkout_id: checkout_id,
        account_id: account_id
    }
}

export function invalidateCheckout(email, account_id = null, checkout_id=null) {
    return {
        type: INVALIDATE,
        email:email,
        checkout_id:checkout_id,
        account_id: account_id
    }
}

function requestCheckout(email, account_id = null, checkout_id = null, start = null, stop = null) {
    return {
        type: REQUEST,
        email:email,
        checkout_id: checkout_id,
        account_id: account_id
    }
}

function receiveCheckout(email, account_id = null, checkout_id = null, json) {
    return {
        type: RECEIVE,
        email:email,
        checkout_id: checkout_id,
        checkout: json,
        receivedAt: Date.now()
    }
}

function refundCheckout(email, checkout_id, amount = null, refund_reason) {
    return {
        type: REFUND,
        email: email,
        checkout_id: checkout_id,
        amount:amount,
        refund_reason:refund_reason
    }
}

function receiveRefund(email, checkout_id, data) {
    return {
        type: RECEIVE_REFUND,
        email: email,
        checkout_id:checkout_id,
        refund: data
    }
}

function requestRefund(email, checkout_id, amount=null, refund_reason) {
    return dispatch => {
        dispatch(refundCheckout(email, checkout_id, amount, refund_reason))
        return $.post("/refund", {"email":email, "checkout_id": checkout_id, "amount":amount, "refund_reason":refund_reason})
        .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
                dispatch(addError(error_data, "refund"));
            })
            .done(function(data){
                //dispatch receive refund action
                dispatch(receiveRefund(email, checkout_id, data));
                
                //clear the error field in the event that there even is one
                dispatch(clearError());

                // update the checkout data for this checkout
                dispatch(fetchCheckoutIfNeeded(email, null, checkout_id));
            })
    }
}

function fetchCheckout(email, account_id = null, checkout_id = null, start = null) {
    return dispatch => {
        dispatch(requestCheckout(email, account_id, checkout_id))

        return $.post("/checkout", {"email":email, "checkout_id":checkout_id, "account_id":account_id, "start":start})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
            })
            .done(function(data){
               //dispatch the receive reach
                dispatch(receiveCheckout(email, account_id, checkout_id, data));
            })
    }
}

function shouldFetchCheckout(state, account_id) {
    if (state.wepay_account && state.wepay_account.searchedAccount.account_id != null && !state.wepay_checkout.checkout.isFetching) {
        return true;
    }
    else if(state.wepay_user.isFetching){
        return false;
    }
    return false;
}

export function fetchCheckoutIfNeeded(email, account_id=null, checkout_id=null, start = null) {
    return (dispatch, getState) => {
        if (shouldFetchCheckout(getState())) {
            return dispatch(fetchCheckout(email, account_id, checkout_id, start))
        }
    }
}

function shouldRefundCheckout(state, checkout_id, amount) {
        var checkout = null;
        console.log("Searching for checkout_id: ", checkout_id)
        for (var i =0; i < state.wepay_checkout.checkout.checkoutInfo.length; i++) {
            if (state.wepay_checkout.checkout.checkoutInfo[i].checkout_id == checkout_id) {
                checkout = state.wepay_checkout.checkout.checkoutInfo[i];
                console.log("Found checkout to refund: ", checkout);
            }
        }
        if (checkout && checkout.amount - checkout.refund.amount_refunded >= amount) {
            console.log("Should refund");
            return true;
        }
        console.log("Should NOT refund");
        return false;
}

export function fetchRefundIfNeeded(email, checkout_id, amount, refund_reason) {
    return(dispatch, getState) => {
        if(shouldRefundCheckout(getState(), checkout_id, amount)) {
            return dispatch(requestRefund(email, checkout_id, amount, refund_reason))
        }
    }
}

export function clearRefund() {
    return {
        type: CLEAR_REFUND
    }
}