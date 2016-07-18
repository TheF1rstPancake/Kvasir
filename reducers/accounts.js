/**
 * Reducer on accounts.  The initial state of a user is an empty array because we have no accounts to display
 */
const accounts = (state=[], action) => {
  switch (action.type) {
    case 'ADD_ACCOUNTS':
      return {
        accountInfo:action.info
      }
    default:
      return state
  }
}

export default accounts
