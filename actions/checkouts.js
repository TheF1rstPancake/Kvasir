export const REQUEST = 'REQUEST_CHECKOUTS'
export const RECEIVE = 'RECEIVE_CHECKOUTS'
export const SEARCH = 'SEARCH_CHECKOUTS'
export const INVALIDATE = 'INVALIDATE_CHECKOUTS'

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

function requestCheckout(email, account_id = null, checkout_id = null) {
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

function fetchCheckout(email, account_id = null, checkout_id = null) {
    return dispatch => {
        dispatch(requestCheckout(email, account_id, checkout_id))

        return $.post("/checkout", {"email":email, "checkout_id":checkout_id, "account_id":account_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = JSON.parse(data.responseText);
            })
            .done(function(data){
                dispatch(receiveCheckout(email, account_id, checkout_id, data))
            })
    }
}

function shouldFetchCheckout(state, account_id) {
    if (state.wepay_account && state.wepay_account.searchedAccount.account_id != null) {
        return true;
    }
    else if(state.wepay_user.isFetching){
        return false;
    }
    return false;
}

export function fetchCheckoutIfNeeded(email, account_id) {
    return (dispatch, getState) => {
        if (shouldFetchCheckout(getState())) {
            return dispatch(fetchCheckout(email, account_id))
        }
    }
}