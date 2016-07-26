import {addError, clearError} from "./errors"

// withdrawal actions
export const REQUEST = 'REQUEST_WITHDRAWALS'
export const RECEIVE = 'RECEIVE_WITHDRAWALS'
export const SEARCH = 'SEARCH_WITHDRAWALS'
export const INVALIDATE = 'INVALIDATE_WITHDRAWALS'
export const CLEAR = "CLEAR_WITHDRAWALS"

// reserve acctions
// we get withdrawal and reserve information at the same time, but they are two seperate wepay api calls
export const REQUEST_RESERVE = "REQUEST_RESERVE"
export const RECEIVE_RESERVE = "RECEIVE_RESERVE"

const ERROR_SCOPE = "withdrawals"

export function searchWithdrawal(account_id = null, withdrawal_id = null) {
    return {
        type: SEARCH,
        withdrawal_id: withdrawal_id,
        account_id: account_id
    }
}

export function invalidateWithdrawal(account_id = null, withdarawl_id=null) {
    return {
        type: INVALIDATE,
        withdarawal_id:withdrawal_id,
        account_id: account_id
    }
}

function requestWithdrawal(account_id = null, withdrawal_id = null) {
    return {
        type: REQUEST,
        withdrawal_id: withdrawal_id,
        account_id: account_id
    }
}

function receiveWithdrawal(account_id = null, withdrawal_id = null, json) {
    return {
        type: RECEIVE,
        withdrawal_id: withdrawal_id,
        withdrawal: json,
        receivedAt: Date.now()
    }
}

function fetchWithdrawal(account_id = null, withdrawal_id = null) {
    return dispatch => {
        dispatch(requestWithdrawal(account_id, withdrawal_id));
        
        // get the reserve information too at this point
        dispatch(fetchReserveDetail(account_id));

        return $.post("/withdrawal", {"withdrawal_id":withdrawal_id, "account_id":account_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
                dispatch(addError(error_data));
            })
            .done(function(data){
                dispatch(receiveWithdrawal(account_id, withdrawal_id, data));
                dispatch(clearError())
            })
    }
}

function receiveReserveDetail(account_id, data) {
    return {
        type: RECEIVE_RESERVE,
        account_id: account_id,
        reserve: data
    }
}

function fetchReserveDetail(account_id) {
    return dispatch => {
        console.log("Fetching Reserves!");
        return $.post("/reserve", {"account_id":account_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = data.responseJSON;
                dispatch(addError(error_data));
            })
            .done(function(data){
                dispatch(receiveReserveDetail(account_id, data));
                dispatch(clearError());
            })
    }

}

function shouldFetchWithdrawal(state) {
    if (state.wepay_account && state.wepay_account.searchedAccount.account_id != null) {
        return true;
    }
    else if(state.wepay_user.isFetching){
        return false;
    }
    return false;
}

export function fetchWithdrawalIfNeeded(account_id) {
    return (dispatch, getState) => {
        if (shouldFetchWithdrawal(getState())) {
            return dispatch(fetchWithdrawal(account_id))
        }
    }
}

export function clearWithdrawals() {
    return {
        type: CLEAR
    }
}