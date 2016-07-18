export const REQUEST = 'REQUEST_WITHDRAWALS'
export const RECEIVE = 'RECEIVE_WITHDRAWALS'
export const SEARCH = 'SEARCH_WITHDRAWALS'
export const INVALIDATE = 'INVALIDATE_WITHDRAWALS'

export function searchWithdrawal(email, account_id = null, withdrawal_id = null) {
    return {
        type: SEARCH,
        email:email,
        withdrawal_id: withdrawal_id,
        account_id: account_id
    }
}

export function invalidateWithdrawal(email, account_id = null, withdarawl_id=null) {
    return {
        type: INVALIDATE,
        email:email,
        withdarawal_id:withdrawal_id,
        account_id: account_id
    }
}

function requestWithdrawal(email, account_id = null, withdrawal_id = null) {
    return {
        type: REQUEST,
        email:email,
        withdrawal_id: withdrawal_id,
        account_id: account_id
    }
}

function receiveWithdrawal(email, account_id = null, withdrawal_id = null, json) {
    return {
        type: RECEIVE,
        email:email,
        withdrawal_id: withdrawal_id,
        withdrawal: json,
        receivedAt: Date.now()
    }
}

function fetchWithdrawal(email, account_id = null, withdrawal_id = null) {
    return dispatch => {
        dispatch(requestWithdrawal(email, account_id, withdrawal_id))

        return $.post("/withdrawal", {"email":email, "withdrawal_id":withdrawal_id, "account_id":account_id})
            .fail(function(data){
                console.log("ERROR: ", data);
                var error_data = JSON.parse(data.responseText);
            })
            .done(function(data){
                dispatch(receiveWithdrawal(email, account_id, withdrawal_id, data))
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

export function fetchWithdrawalIfNeeded(email, account_id) {
    return (dispatch, getState) => {
        if (shouldFetchWithdrawal(getState())) {
            return dispatch(fetchWithdrawal(email, account_id))
        }
    }
}