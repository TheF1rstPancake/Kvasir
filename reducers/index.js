import { combineReducers } from 'redux'
import wepay_user from './user'
import wepay_account from './accounts'
import wepay_checkout from './checkouts'
import wepay_withdrawal from './withdrawals'
import wepay_payer from './payer'
import errors from './errors'
import wepay_card from './credit_card'



/*Combine all the reducers to import into the main application*/
const todoApp = combineReducers({
  wepay_user,
  wepay_account,
  wepay_checkout,
  wepay_withdrawal,
  wepay_payer,
  wepay_card,
  errors
})

export default todoApp
