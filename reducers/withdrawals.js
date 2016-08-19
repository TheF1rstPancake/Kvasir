/**
 * Reducer on withdrawals.  The initial state of a user is an empty array because we have no accounts to display
 */
import { combineReducers } from 'redux'

import {
    SEARCH, INVALIDATE,
    REQUEST, RECEIVE, CLEAR, RECEIVE_RESERVE
} from '../actions/withdrawals'

import {
    CLEAR_ALL_STATE
} from "../actions/errors"

var defaultWithdrawalState = {
    isFetching: false,
    didInvalidate: false,
    withdrawalInfo: [],
    withdrawal_id: null,
    account_id: null
};

function searchedWithdrawal(state = {}, action) {
    switch (action.type) {
        case SEARCH:
            return Object.assign({}, state, {"account_id":action.account_id, "withdrawal_id":action.withdrawal_id})
        default:
            return state
    }
}

function withdrawal_base(state = defaultWithdrawalState, action) {
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
        if (action.account_id != state.account_id || action.withdrawal_id != state.withdrawal_id){
            return state;
        }
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
            return Object.assign({}, state, withdrawal_base(state, action));
        case SEARCH:
            return Object.assign({}, state, searchedWithdrawal(state, action));
        case CLEAR:
        case CLEAR_ALL_STATE:
            return {};
        default:
            return state;
    }
}

const wepay_withdrawal = combineReducers({
    withdrawal
})

export default wepay_withdrawal