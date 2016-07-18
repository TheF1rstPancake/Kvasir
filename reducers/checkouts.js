/**
 * Reducer on accounts.  The initial state of a user is an empty array because we have no accounts to display
 */
const checkouts = (state=[], action) => {
  switch (action.type) {
    case 'ADD_CHECKOUTS':
      return {
        checkoutInfo:action.info
      }
    default:
      return state
  }
}

export default checkouts
