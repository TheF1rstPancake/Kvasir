/*
 * Actions for credit card objects
 */
import {addError, clearError} from "./errors"

export const REQUEST = 'REQUEST_CREDIT_CARD'
export const RECEIVE = 'RECEIVE_CREDIT_CARD'
export const SEARCH = 'SEARCH_CREDIT_CARD'
export const INVALIDATE = 'INVALIDATE_CREDIT_CARD'
export const CLEAR = "CLEAR_CREDIT_CARD"

export function searchCard(cc_id = null, type="credit_card") {
    return {
        type: SEARCH,
        cc_id: cc_id,
        request_type: "credit_card"
    }
}

export function invalidateCard(cc_id = null) {
    return {
        type: INVALIDATE,
        cc_id: cc_id
    }
}

function requestCard(cc_id = null, type="credit_card") {
    return {
        type: REQUEST,
        cc_id: cc_id,
        request_type: type
    }
}

function receiveCard(cc_id = null, json, type="credit_card") {
    return {
        type: RECEIVE,
        cc_id: cc_id,
        request_type: type,
        card: json,
        receivedAt: Date.now()
    }
}

function fetchCard(cc_id = null, type="credit_card") {
    var url = "/"+type;
    return dispatch => {
        dispatch(requestCard(cc_id));
        
        return $.post(url, {"id":cc_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
                dispatch(addError(error_data));
            })
            .done(function(data){
                dispatch(receiveCard(cc_id, data, type));
                dispatch(clearError());
            })
    }
}

function shouldFetchCard(state, cc_id = null) {
    if (cc_id) {
        return true;
    }
    return false;
}

export function fetchCardIfNeeded(cc_id=null, type="credit_card") {
    return (dispatch, getState) => {
        if (shouldFetchCard(getState(), cc_id)) {
            return dispatch(fetchCard(cc_id, type))
        }
    }
}

export function clearCard() {
    return {
        type: CLEAR
    }
}