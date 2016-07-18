import { combineReducers } from 'redux'
import user from './user'
import accounts from './accounts'
import checkouts from './checkouts'
import withdrawals from './withdrawals'
import errors from './errors'
import wepay from "./wepay"

/*Combine all the reducers to import into the main application*/
const todoApp = combineReducers({
  user,
  accounts,
  checkouts,
  withdrawals,
  errors,
  wepay
})

export default todoApp
