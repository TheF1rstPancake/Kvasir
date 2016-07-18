/**
 * Reducer on withdrawals.  The initial state of a user is an empty array because we have no accounts to display
 */
const withdrawals = (state={}, action) => {
  switch (action.type) {
    case 'ADD_WITHDRAWALS':
      return {
        withdrawalInfo:action.info
      }
    default:
      return state
  }
}

export default withdrawals
