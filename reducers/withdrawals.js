/**
 * Reducer on withdrawals.  The initial state of a user is an empty array because we have no accounts to display
 */
import { combineReducers } from 'redux'

import {
    SEARCH, INVALIDATE,
    REQUEST, RECEIVE, CLEAR, RECEIVE_RESERVE
} from '../actions/withdrawals'

function searchedWithdrawal(state = {}, action) {
    switch (action.type) {
        case SEARCH:
            return Object.assign({}, state, {"email":action.email, "account_id":action.account_id, "withdrawal_id":action.withdrawal_id})
        default:
            return state
    }
}

function withdrawal_base(state = {
    isFetching: false,
    didInvalidate: false,
    withdrawalInfo: []
}, action) {
    switch (action.type) {
        case INVALIDATE:
        return Object.assign({}, state, {
            didInvalidate: true
        })
        case REQUEST:
        return Object.assign({}, state, {
            isFetching: true,
            didInvalidate: false
        })
        case RECEIVE:
        return Object.assign({}, state, {
            isFetching: false,
            didInvalidate: false,
            withdrawalInfo: action.withdrawal,
            lastUpdated: action.receivedAt
        })
        case RECEIVE_RESERVE:
            return Object.assign({}, state, {
                reserveInfo: action.reserve
            });
        default:
        return state
    }
}

function withdrawal(state = {}, action) {
    switch (action.type) {
        case INVALIDATE:
        case RECEIVE:
        case REQUEST:
        case RECEIVE_RESERVE:
            return Object.assign({}, state, withdrawal_base(state, action))
        case CLEAR:
            return {}
        default:
            return state
    }
}

const wepay_withdrawal = combineReducers({
    searchedWithdrawal,
    withdrawal
})

export default wepay_withdrawal