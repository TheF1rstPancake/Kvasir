/**
 * Reducer on users.  The initial state of a user is an empty string because we don't know anything about them.
 */
const user = (state={}, action) => {
  switch (action.type) {
    case 'ADD_USER':
      return {
        userInfo:action.info
      }
    default:
      return state
  }
}

export default user
