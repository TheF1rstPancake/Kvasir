/**
 * Component for rendering and interacting with WePay account objects.
 * A WePay user can have 1 or many accounts.
 * When a user clicks on the account they want to further investigate, we can then fetch the information about the withdrawals and checkouts made with that account.
 * This object is responsible for making calls to the backend and then dispatching appropriate actions so that the Withdrawal and Checkout components update accordingly
 */

import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table} from "react-bootstrap"
import { connect } from 'react-redux'
import {addCheckouts, clearCheckouts} from "../actions/checkouts"
import {addWithdrawals, clearWithdrawals} from "../actions/withdrawals"
import {addError} from "../actions/errors"
import {BootstrapTable} from "react-bootstrap-table"

import {fetchWithdrawalIfNeeded} from "../actions/withdrawals"
import {fetchCheckoutIfNeeded} from "../actions/checkouts"

import {searchAccount} from "../actions/accounts"

import Base from "./Base"

var AccountBlock= React.createClass({
    getInitialState: function() {
        return {
            accountInfo: {},
            error: {},
            selectRowProp: {
                mode: "radio",
                clickToSelect: true,
                bgColor: "rgb(249, 255, 172)",
                onSelect: this.handleClick
            }
        }
    },
    handleClick: function(row, isSelected) {
        // set the account 
        var account_id = row.account_id;
        this.props.dispatch(searchAccount(account_id));
        
        // clear current widthdrawals and checkouts
        this.props.dispatch(clearWithdrawals());
        this.props.dispatch(clearCheckouts());

        // fetch the checkouts
        this.props.dispatch(fetchCheckoutIfNeeded(account_id));

        // fetch the withdrawals
        this.props.dispatch(fetchWithdrawalIfNeeded(account_id));
    },
    formatAccountId: function(col, row) {
        return <div>{col} - {row.account_id}</div>;
    },
    serialize: function(info) {
        var array = [];
        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    
    render: function() {
        var accounts = this.props.accountInfo;
        var this2 = this;
        if (accounts == null || $.isEmptyObject(accounts)  || $.isEmptyObject(this.props.error)==false) {
            return (<div></div>);
        }
        else {
            accounts = this.serialize(accounts); 
            return (
                <div id="account_info">
                    <h4> Account Details </h4>
                    <BootstrapTable
                        data = {accounts}
                        striped={true}
                        hover={true}
                        pagination={true}
                        search={true}
                        selectRow = {this.state.selectRowProp}
                        width="99%"
                    >
                        <TableHeaderColumn 
                            dataField="name" 
                            >
                            Account Name
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="account_id"
                            isKey={true}
                            >
                            Account Id
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="balances_0_balance" 
                            >
                            Balance ({accounts[0] ? accounts[0].balances_0_currency : "Currency"})
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="balances_0_withdrawal_bank_name" 
                            >
                            Bank
                        </TableHeaderColumn>
                    </BootstrapTable>
                </div>
            );
        }
    }
});


const mapStateToProps = (state) => {
    return {
        accountInfo:state.wepay_account.account.accountInfo,
        searchedAccount: state.wepay_account.searchedAccount,
        email: state.wepay_user.searchedUser.email,
        error: state.errors.global ? state.errors.global.info : {}
    }
}

AccountBlock = connect(mapStateToProps)(AccountBlock);



export default AccountBlock
