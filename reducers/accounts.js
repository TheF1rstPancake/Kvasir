/**
 * Reducer on accounts.  The initial state of a user is an empty array because we have no accounts to display
 */

import { combineReducers } from 'redux'

import {
    SEARCH_ACCOUNT, INVALIDATE_ACCOUNT,
    REQUEST_ACCOUNT, RECEIVE_ACCOUNT, CLEAR_ACCOUNTS
} from '../actions/accounts'

import {CLEAR_ALL_STATE} from "../actions/errors"

var defaultAccountState = {
    isFetching: false,
    didInvalidate: false,
    accountInfo: []
};

function searchedAccount(state = {}, action) {
    switch (action.type) {
        case SEARCH_ACCOUNT:
            return Object.assign({}, state, {"account_id":action.account_id})
        default:
            return state
    }
}

function account_base(state = defaultAccountState, action) {
    switch (action.type) {
        case INVALIDATE_ACCOUNT:
            return Object.assign({}, state, {
                didInvalidate: true
            })
        case REQUEST_ACCOUNT:
            return Object.assign({}, state, {
                isFetching: true,
                didInvalidate: false
            })
        case RECEIVE_ACCOUNT:
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                accountInfo: action.accounts,
                lastUpdated: action.receivedAt
            })
        default:
            return state
    }
}

function account(state = [], action) {
    switch (action.type) {
        case INVALIDATE_ACCOUNT:
        case RECEIVE_ACCOUNT:
        case REQUEST_ACCOUNT:
            return Object.assign([], state, account_base(state, action))
        case CLEAR_ACCOUNTS:
        case CLEAR_ALL_STATE:
            return {}            
        default:
            return state
    }
}

const wepay_account = combineReducers({
    searchedAccount,
    account
})

export default wepay_account
