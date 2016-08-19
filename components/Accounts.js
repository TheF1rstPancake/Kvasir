/**
 * Component for rendering and interacting with WePay account objects.
 * A WePay user can have 1 or many accounts.
 * When a user clicks on the account they want to further investigate, we can then fetch the information about the withdrawals and checkouts made with that account.
 * This object is responsible for making calls to the backend and then dispatching appropriate actions so that the Withdrawal and Checkout components update accordingly
 */

import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table} from "react-bootstrap"
import { connect } from 'react-redux'
import {searchCheckout, clearCheckouts, fetchCheckoutIfNeeded} from "../actions/checkouts"
import {addWithdrawals, clearWithdrawals, fetchWithdrawalIfNeeded} from "../actions/withdrawals"
import {clearPayer} from "../actions/payer"
import {clearCard} from "../actions/credit_card"
import {addError} from "../actions/errors"
import {BootstrapTable} from "react-bootstrap-table"

import {searchAccount} from "../actions/accounts"

import Base from "./Base"

var AccountBlock= React.createClass({
    /**
     * Get the initial state the object
     *
     * This state simply holds the information for what happens when a row of the account table is selected
     */
    getInitialState: function() {
        return {
            selectRowProp: {
                mode: "radio",
                clickToSelect: false,
                bgColor: "rgb(249, 255, 172)",
                onSelect: this.handleClick
            }
        }
    },
    accountPopover: function(row) {
        console.log("Rollover!");

        $("#account_table .react-bs-table").attr({
            "data-placement":   "top", 
            "data-content":     row.action_reasons_0.toString()
        });
        console.log((<p>{row.action_reasons_0}</p>))
        $("#account_table .react-bs-table").popover("show")
    },
    formatBalance: function(cell, row) {

    },
    /**
     * Defines the behavior when a row in the table is selected
     *
     * This will clear all objects that are linked to this table because we want to overwrite all of that info
     * This means that we need to clear withdrawals, checkouts, and the payer table (clearing withdrawals also takes care of reserves)
     * 
     * After everything has been cleared, we fetch the 50 most recent checkouts tied to the account, and the 50 most recent withdrawals and reserve states
     */
    handleClick: function(row, isSelected) {
        // set the account 
        var account_id = row.account_id;
        this.props.dispatch(searchAccount(account_id));
        
        // clear current widthdrawals and checkouts
        this.props.dispatch(clearWithdrawals());
        this.props.dispatch(clearCheckouts());
        this.props.dispatch(clearPayer());
        this.props.dispatch(clearCard());

        // fetch the checkouts
        this.props.dispatch(searchCheckout(account_id));
        this.props.dispatch(fetchCheckoutIfNeeded(account_id));

        // fetch the withdrawals
        this.props.dispatch(fetchWithdrawalIfNeeded(account_id));
    },
    /**
     * React-bootstrap-table requires that the data passed to it is a list of flat dictionaries.
     * However, WePay often has nested structures.
     * This function will flatten all of the accounts so that we can pass the data to the table
     *
     * @param info  -   the list of nested dictionaries containing account information
     */
    serialize: function(info) {
        var array = [];
        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    /**
     * Render the account table
     *
     * If there are multiple accounts, each one will be displayed on a different row.
     */
    render: function() {
        var accounts = this.props.accountInfo;
        var this2 = this;
        if (this.props.isFetching) {
            return Base.isFetchingSpinner();
        }
        else if (accounts == null || $.isEmptyObject(accounts)  || $.isEmptyObject(this.props.error)==false) {
            return (<div></div>);
        }
        else {
            accounts = this.serialize(accounts); 
            return (
                <div id="account_table">
                    <h4> Account Details </h4>
                    <BootstrapTable
                        id="account_data"
                        data = {accounts}
                        striped={true}
                        hover={true}
                        pagination={true}
                        selectRow = {this.state.selectRowProp}
                        ref="account_data"
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
                            dataField="create_time"
                            dataFormat={Base.formatDate}
                        >
                            Create Time
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="balances_0_balance" 
                            dataFormat={this.formatBalance}
                            >
                            Balance ({accounts[0] ? accounts[0].balances_0_currency : "Currency"})
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="balances_0_withdrawal_bank_name" 
                            >
                            Bank
                        </TableHeaderColumn>
                    </BootstrapTable>
                    <hr></hr>
                </div>
            );
        }
    }
});

/**
 * Map the Redux state to props for this object
 *
 * accountInfo:         a list of dictionaries representing different accounts
 * isFetching:          true if the object is currently fetching account details
 * error:               errors raised by /actions/accounts and /reducers/accounts 
 */
const mapStateToProps = (state) => {
    return {
        accountInfo:        state.wepay_account.account.accountInfo,
        isFetching:         state.wepay_account.account.isFetching,
        error:              state.errors.account ? state.errors.account.info : {},
    }
}

AccountBlock = connect(mapStateToProps)(AccountBlock);



export default AccountBlock
