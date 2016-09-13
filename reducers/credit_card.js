/**
 * Reducer on credit_cards.
 */
import { combineReducers } from 'redux'

import {
    SEARCH, INVALIDATE, REQUEST, RECEIVE, CLEAR
} from '../actions/credit_card'

import {
    CLEAR_ALL_STATE
} from "../actions/errors"

var defaultCardState = {
    isFetching: false,
    didInvalidate: false,
    cardInfo: [],
    requestType: "credit_card",
    cc_id: null
};

function searchedCard(state = {"cc_id":""}, action) {
    switch (action.type) {
        case SEARCH:
            return Object.assign({}, state, {"cc_id": action.cc_id, "request_type":action.request_type});
        case CLEAR:
            return {}
        default:
            return state
    }
}

function card_base(state = defaultCardState, action) {
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
            if(state.cc_id != action.cc_id || state.request_type != action.request_type){
                return state;
            }
            return Object.assign({}, state, {
                isFetching: false,
                didInvalidate: false,
                cardInfo: action.card,
                requestType: action.request_type,
                lastUpdated: action.receivedAt
            })
        default:
            return state
    }
}

function card(state = { }, action) {
    switch (action.type) {
        case INVALIDATE:
        case RECEIVE:
        case REQUEST:
            return Object.assign({}, state, card_base(state, action));
        case SEARCH:
            return Object.assign({}, state, searchedCard(state, action));
        case CLEAR:
        case CLEAR_ALL_STATE:
            console.log("CLEARING CREDIT CARD: ", action.type);
            return {}
        default:
            return state
    }
}

const wepay_card = combineReducers({
    card
})

export default wepay_card