/**
 * Reducer on errors.
 */
const errors = (state={}, action) => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        info:action.info
      }
    default:
      return state
  }
}

export default errors
