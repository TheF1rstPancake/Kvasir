import {addError, clearError} from "./errors"

export const REQUEST = "REQUEST_PAYER"
export const RECEIVE = "RECEIVE_PAYER"
export const SEARCH = "SEARCH_PAYER"
export const INVALIDATE = "INVALIDATE_PAYER"
export const CLEAR = "CLEAR_PAYER"

export function searchPayer(email) {
    return {
        type: SEARCH,
        info:{"email": email}
    }
}

function requestPayer(email) {
    return {
        type: REQUEST,
        email:email
    }
}

function receivePayer(email, json) {
    return {
        type: RECEIVE,
        email:email,
        payer: json,
        receivedAt: Date.now()
    }
}

function fetchPayer(email, callback) {
    return dispatch => {
        dispatch(requestPayer(email));

        return $.post("/payer", {"email":email})
            .fail(function(data) {
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
                dispatch(addError(error_data));
            })
            .done(function(data){
                console.log("RECEIVED PAYER REQUEST: ", data);
                dispatch(receivePayer(email, data));
                dispatch(clearError());
                if(callback != undefined) {
                    console.log("CALLBACK: ", callback);
                    callback();
                }
            });
    }
}

export function clearPayer() {
    return {
        type: CLEAR
    }
}

function shouldFetchPayer(state, email) {
    console.log(state.wepay_payer);
    if(state.wepay_payer) {
        console.log("Should fetch payer");
        return true;
    }
    else if (state.wepay_payer.isFetching) {
        console.log("Already fetching payer!");
        return false;
    }
    return false;
}

export function fetchPayerIfNeeded(email, callback) {
    return (dispatch, getState) => {
        if(shouldFetchPayer(getState(), email)) {
            return dispatch(fetchPayer(email, callback));
        }
    }
}