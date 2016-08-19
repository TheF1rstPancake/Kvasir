/**
 * Reducer on users.  It is comprised of two objects:
 *  
 *
 * Initial State - the intital state for a user is a {}
 */
import { combineReducers } from 'redux'

import {
    SEARCH_USER, INVALIDATE_USER,
    REQUEST_USER, RECEIVE_USER, CLEAR_USER
} from '../actions/user'

import {
    CLEAR_ALL_STATE
} from "../actions/errors"

var userDefaultState = {
    isFetching: false,
    didInvalidate: false,
    userInfo: {}
};

function searchedUser(state = {"email":"", "account_id":""}, action) {
    switch (action.type) {
        case SEARCH_USER:
            return Object.assign({}, state, action.info);
        default:
            return state
    }
}

function user_base(state = userDefaultState, action) {
    switch (action.type) {
        case INVALIDATE_USER:
            return Object.assign({}, state, {
                didInvalidate:  true,
                isFetching:     false,
            })
        case REQUEST_USER:
            return Object.assign({}, state, {
                isFetching:         true,
                didInvalidate:      false
            })
        case RECEIVE_USER:
            return Object.assign({}, state, {
                isFetching:      false,
                didInvalidate:   false,
                userInfo:        action.user,
                lastUpdated:     action.receivedAt
            })
        default:
            return state
    }
}

function user(state = { }, action) {
    switch (action.type) {
        case INVALIDATE_USER:
        case RECEIVE_USER:
        case REQUEST_USER:
            return Object.assign({}, state, user_base(state, action))
        case CLEAR_USER:
        case CLEAR_ALL_STATE:
            return {}
        default:
            return state
    }
}

const wepay_user = combineReducers({
    searchedUser,
    user
})

export default wepay_user