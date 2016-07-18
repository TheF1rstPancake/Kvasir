import { combineReducers } from 'redux'
import wepay_user from './user'
import wepay_account from './accounts'
import checkouts from './checkouts'
import wepay_withdrawal from './withdrawals'
import errors from './errors'

/*Combine all the reducers to import into the main application*/
const todoApp = combineReducers({
  wepay_user,
  wepay_account,
  checkouts,
  wepay_withdrawal,
  errors
})

export default todoApp
