import {addError, clearError} from "./errors"

export const REQUEST_USER = 'REQUEST_USERS'
export const RECEIVE_USER = 'RECEIVE_USERS'
export const SEARCH_USER = 'SEARCH_USERS'
export const INVALIDATE_USER = 'INVALIDATE_USER'
export const CLEAR_USER = "CLEAR_USER"

export function clearUser() {
    return {
        type: CLEAR_USER
    }
}

export function searchUser(email = null, account_id =null) {
    return {
        type: SEARCH_USER,
        info: {"email":email,
            "account_id": account_id
        }
    }
}

export function invalidateUser(email) {
    return {
        type: INVALIDATE_USER,
        email:email
    }
}

function requestUser(email) { 
        return {
            type: REQUEST_USER,
            email:email
        }
}

function receiveUser(email, json) {
    return {
        type: RECEIVE_USER,
        email:email,
        user: json,
        receivedAt: Date.now()
    }
}

function fetchUser(email, account_id, callback) {
    return dispatch => {
        dispatch(requestUser(email))
        return $.post("/user", {"email":email, "account_id":account_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                // add error
                var error_data = data.responseJSON;
                dispatch(addError(error_data));

                // clear the user info
                dispatch(clearUser());
            })
            .done(function(data){
                dispatch(receiveUser(email, data));

                // clear any existing errors
                dispatch(clearError());
                if(callback != undefined) {
                    console.log("CALLBACK: ", callback);
                    callback();
                }
            })
    }
}

function shouldFetchUser(state, email) {
    if (state.wepay_user && state.wepay_user.searchedUser) {
        console.log("Should fetch user");
        return true;
    }
    else if(state.wepay_user.isFetching){
        return false;
    }
    return false;
}

export function fetchUserIfNeeded(email=null, account_id = null, callback = null) {
    return (dispatch, getState) => {
        if (shouldFetchUser(getState(), email)) {
            return dispatch(fetchUser(email, account_id, callback))
        }
    }
}