/**
 * Reducer on payers.
 */
import { combineReducers } from 'redux'

import {
    SEARCH, INVALIDATE, REQUEST, RECEIVE, CLEAR
} from '../actions/payer'

import {
    CLEAR_ALL_STATE
} from "../actions/errors"

var defaultPayerState = {
    isFetching: false,
    didInvalidate: false,
    payerInfo: []
};

function searchedPayer(state = {"email":"", "account_id":""}, action) {
    switch (action.type) {
        case SEARCH:
            return Object.assign({}, state, action.info)
        case CLEAR:
            return {}
        default:
            return state
    }
}

function payer_base(state = defaultPayerState, action) {
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
            payerInfo: action.payer.payer_checkouts,
            lastUpdated: action.receivedAt
        })
        default:
            return state
    }
}

function payer(state = { }, action) {
    switch (action.type) {
        case INVALIDATE:
        case RECEIVE:
        case REQUEST:
            return Object.assign({}, state, payer_base(state, action))
        case CLEAR:
        case CLEAR_ALL_STATE:
            return {}
        default:
            return state
    }
}

const wepay_payer = combineReducers({
    searchedPayer,
    payer
})

export default wepay_payer