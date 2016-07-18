export const REQUEST_USER = 'REQUEST_USERS'
export const RECEIVE_USER = 'RECEIVE_USERS'
export const SEARCH_USER = 'SEARCH_USERS'
export const INVALIDATE_USER = 'INVALIDATE_USER'

export function searchUser(email) {
    return {
        type: SEARCH_USER,
        email:email
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

function fetchUser(email) {
    return dispatch => {
        dispatch(requestUser(email))

        return $.post("/user", {"email":email})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = JSON.parse(data.responseText);
            })
            .done(function(data){
                dispatch(receiveUser(email, data))
            })
    }
}

function shouldFetchUser(state, email) {
    if (state.wepay && state.wepay.searchedUser != "") {
        console.log("Should fetch user");
        return true;
    }
    else if(state.wepay.isFetching){
        return false;
    }
    return false;
}

export function fetchUserIfNeeded(email) {
    return (dispatch, getState) => {
        if (shouldFetchUser(getState(), email)) {
            return dispatch(fetchUser(email))
        }
    }
}