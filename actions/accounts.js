export const REQUEST_ACCOUNT = 'REQUEST_ACCOUNT'
export const RECEIVE_ACCOUNT = 'RECEIVE_ACCOUNT'
export const SEARCH_ACCOUNT = 'SEARCH_ACCOUNT'
export const INVALIDATE_ACCOUNT = 'INVALIDATE_ACCOUNT'

export function searchAccount(email, account_id = null) {
    return {
        type: SEARCH_ACCOUNT,
        email:email,
        account_id: account_id
    }
}

export function invalidateAccount(email, account_id = null) {
    return {
        type: INVALIDATE_ACCOUNT,
        email:email,
        account_id: account_id
    }
}

function requestAccount(email, account_id = null) {
    return {
        type: REQUEST_ACCOUNT,
        email:email,
        account_id: account_id
    }
}

function receiveAccount(email, account_id = null, json) {
    return {
        type: RECEIVE_ACCOUNT,
        email:email,
        account_id: account_id,
        accounts: json,
        receivedAt: Date.now()
    }
}

function fetchAccount(email, account_id = null) {
    return dispatch => {
        dispatch(requestAccount(email, account_id));
        
        return $.post("/account", {"email":email, "account_id":account_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = JSON.parse(data.responseText);
            })
            .done(function(data){
                dispatch(receiveAccount(email, account_id, data))
            })
    }
}

function shouldFetchAccount(state, email, account_id = null) {
    if (state.wepay_user && state.wepay_user.searchedUser != "") {
        return true;
    }
    else if(state.wepay_user.isFetching){
        return false;
    }
    return false;
}

export function fetchAccountIfNeeded(email) {
    return (dispatch, getState) => {
        if (shouldFetchAccount(getState(), email)) {
            return dispatch(fetchAccount(email))
        }
    }
}