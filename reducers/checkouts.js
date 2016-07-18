/**
 * Reducer on accounts.  The initial state of a user is an empty array because we have no accounts to display
 */
import { combineReducers } from 'redux'

import {
    SEARCH, INVALIDATE,
    REQUEST, RECEIVE
} from '../actions/checkouts'

function searchedCheckout(state = {}, action) {
    switch (action.type) {
        case SEARCH:
            return Object.assign({}, state, {"email":action.email, "account_id":action.account_id, "checkout_id":action.checkout_id})
        default:
            return state
    }
}

function checkout_base(state = {
    isFetching: false,
    didInvalidate: false,
    checkoutInfo: []
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
            checkoutInfo: action.checkout,
            lastUpdated: action.receivedAt
        })
        default:
        return state
    }
}

function checkout(state = {}, action) {
    switch (action.type) {
        case INVALIDATE:
        case RECEIVE:
        case REQUEST:
            return Object.assign({}, state, checkout_base(state, action))
        default:
            return state
    }
}

const wepay_checkout = combineReducers({
    searchedCheckout,
    checkout
})

export default wepay_checkout