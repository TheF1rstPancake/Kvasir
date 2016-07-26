import {addError, clearError} from "./errors"

export const REQUEST = 'REQUEST_CHECKOUTS'
export const RECEIVE = 'RECEIVE_CHECKOUTS'
export const SEARCH = 'SEARCH_CHECKOUTS'
export const INVALIDATE = 'INVALIDATE_CHECKOUTS'
export const REFUND = "REFUND_CHECKOUT"
export const RECEIVE_REFUND = "RECEIVE_REFUND_CHECKOUT"
export const CLEAR_REFUND = "CLEAR_REFUND_STATE"
export const CLEAR_CHECKOUTS = "CLEAR_CHECKOUTS"

export function searchCheckout(account_id = null, checkout_id=null) {
    return {
        type: SEARCH,
        checkout_id: checkout_id,
        account_id: account_id
    }
}

export function invalidateCheckout(account_id = null, checkout_id=null) {
    return {
        type: INVALIDATE,
        checkout_id:checkout_id,
        account_id: account_id
    }
}

function requestCheckout(account_id = null, checkout_id = null, start = null, stop = null) {
    return {
        type: REQUEST,
        checkout_id: checkout_id,
        account_id: account_id
    }
}

function receiveCheckout(account_id = null, checkout_id = null, json) {
    return {
        type: RECEIVE,
        account_id: account_id,
        checkout_id: checkout_id,
        checkout: json,
        receivedAt: Date.now()
    }
}

function refundCheckout(checkout_id, amount = null, refund_reason) {
    return {
        type: REFUND,
        checkout_id: checkout_id,
        amount:amount,
        refund_reason:refund_reason
    }
}

function receiveRefund(checkout_id, data) {
    return {
        type: RECEIVE_REFUND,
        checkout_id:checkout_id,
        refund: data
    }
}

function requestRefund(checkout_id, amount=null, refund_reason) {
    return dispatch => {
        dispatch(refundCheckout(checkout_id, amount, refund_reason))
        return $.post("/refund", {"checkout_id": checkout_id, "amount":amount, "refund_reason":refund_reason})
        .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
                dispatch(addError(error_data, "refund"));
            })
            .done(function(data){
                //dispatch receive refund action
                dispatch(receiveRefund(checkout_id, data));
                
                //clear the error field in the event that there even is one
                dispatch(clearError());

                // update the checkout data for this checkout
                dispatch(fetchCheckoutIfNeeded(null, checkout_id));
            })
    }
}

function fetchCheckout(account_id = null, checkout_id = null, start = null) {
    return dispatch => {
        dispatch(requestCheckout(account_id, checkout_id))

        return $.post("/checkout", {"checkout_id":checkout_id, "account_id":account_id, "start":start})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
            })
            .done(function(data){
               //dispatch the receive reach
                dispatch(receiveCheckout(account_id, checkout_id, data));
            })
    }
}

function shouldFetchCheckout(state, account_id, checkout_id) {
    if (state.wepay_user && (account_id || checkout_id)) {
        console.log("Should fetch checkout!")
        return true;
    }
    else if(state.wepay_user.isFetching){
        console.log("Still fetching user info.  Can't fetch checkouts yet.")
        return false;
    }
    console.log("Do not fetch checkouts");
    return false;
}

export function fetchCheckoutIfNeeded(account_id=null, checkout_id=null, start = null) {
    return (dispatch, getState) => {
        if (shouldFetchCheckout(getState(), account_id, checkout_id)) {
            return dispatch(fetchCheckout(account_id, checkout_id, start))
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

export function fetchRefundIfNeeded(checkout_id, amount, refund_reason) {
    return(dispatch, getState) => {
        if(shouldRefundCheckout(getState(), checkout_id, amount)) {
            return dispatch(requestRefund(checkout_id, amount, refund_reason))
        }
    }
}

export function clearRefund() {
    return {
        type: CLEAR_REFUND
    }
}

export function clearCheckouts() {
    return {
        type: CLEAR_CHECKOUTS
    }
}