/**
 * Reducer on accounts.  The initial state of a user is an empty array because we have no accounts to display
 */
import { combineReducers } from 'redux'

import {
    SEARCH, INVALIDATE,
    REQUEST, RECEIVE, REFUND, RECEIVE_REFUND, CLEAR_REFUND
} from '../actions/checkouts'

function searchedCheckout(state = {}, action) {
    switch (action.type) {
        case SEARCH:
            return Object.assign({}, state, {"email":action.email, "account_id":action.account_id, "checkout_id":action.checkout_id})
        default:
            return state
    }
}

function updateSingleCheckout(checkout, action) {
    return Object.assign({}, checkout, action.checkout);
}

function updateCheckout(state, action) {
    console.log("Updating checkout: ", action)
    for (var i = 0; i < state.checkoutInfo.length; i++) {
        if(state.checkoutInfo[i].checkout_id == action.checkout_id) {
            state.checkoutInfo =  [
            ...state.checkoutInfo.slice(0, i),
            updateSingleCheckout(state.checkoutInfo[i], action),
            ...state.checkoutInfo.slice(i+1)
            ];
            break;
        }
    }
    state.isFeteching = false;
    return state
}

function appendCheckouts(state, action){
    if (state.checkoutInfo.length > 0) {

    }
}



function checkout_base(state = {
    isFetching: false,
    didInvalidate: false,
    submitted_refund: false,
    successful_refund:false,
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
            if (action.checkout_id) {
                return Object.assign({}, state, updateCheckout(state, action));
            }
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                checkoutInfo: (state.checkoutInfo ? state.checkoutInfo.concat(action.checkout): action.checkout),
                lastUpdated: action.receivedAt
            })
        case REFUND:
            return Object.assign({}, state, {
                submitted_refund: true,
                successful_refund:false,
            })
        case RECEIVE_REFUND:
            return Object.assign({}, state, {
                submitted_refund: false,
                successful_refund:true,
            })
        case CLEAR_REFUND:
            return Object.assign({}, state, {
                submitted_refund: false,
                successful_refund:false,
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
        case RECEIVE_REFUND:
        case REFUND:
        case CLEAR_REFUND:
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