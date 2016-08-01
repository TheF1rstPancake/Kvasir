import {CLEAR_ERROR, ADD_ERROR, CLEAR_ALL_STATE} from "../actions/errors"
/**
 * Reducer on errors.
 */
const errors = (state={}, action) => {
  switch (action.type) {
    case ADD_ERROR:
      return {
        [action.scope]: {
            info:action.info
        }
      }
    case CLEAR_ALL_STATE:
      return {
        [action.error.scope]: {
          info:action.error.info
        }
      }
    case CLEAR_ERROR:
        // pop the error structure pointed to by the given scope
        var n = Object.assign({}, state, state); 
        delete n[action.scope];
        return n;
    default:
      return state
  }
}

export default errors
