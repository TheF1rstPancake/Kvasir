/**
 * Component for rendering and interacting with WePay account objects.
 * A WePay user can have 1 or many accounts.
 * When a user clicks on the account they want to further investigate, we can then fetch the information about the withdrawals and checkouts made with that account.
 * This object is responsible for making calls to the backend and then dispatching appropriate actions so that the Withdrawal and Checkout components update accordingly
 */

import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table} from "react-bootstrap"
import { connect } from 'react-redux'
import {addCheckouts} from "../actions/checkouts"
import {addWithdrawals} from "../actions/withdrawals"
import {addError} from "../actions/errors"
import {BootstrapTable} from "react-bootstrap-table"

import {fetchWithdrawalIfNeeded} from "../actions/withdrawals"
import {searchAccount} from "../actions/accounts"

import Base from "./Base"

var AccountBlock= React.createClass({
    getInitialState: function() {
        return {
            accountInfo: {},
            error: {}
        }
    },
    handleClick: function(event) {
        var this2 = this;
        $.post("/checkout", {"email":this.props.email, "account_id": event.target.id})
             .fail(function(data){
                console.log("ERROR: ", data);
                this2.setState({error:data.responseJSON});
                this2.props.dispatch(addCheckouts({}));
            })
            .done(function(data){
                this2.setState(
                    {error:{}}
                );
                this2.props.dispatch(addCheckouts(data));
            });

        this.props.dispatch(searchAccount(this.props.email, event.target.id));
         this.props.dispatch(fetchWithdrawalIfNeeded(this.props.email, event.target.id));
    },
    formatAccountId: function(col, row) {
        return <a href='#' id={row.account_id} onClick={this.handleClick}>{col} - {row.account_id}</a>;
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
        console.log("ACCOUNT INFO: ", this.props.accountInfo);
        var this2 = this;
        if (accounts == null || $.isEmptyObject(accounts)  || $.isEmptyObject(this.props.error)==false) {
            return (<div></div>);
        }
        else {
            accounts = this.serialize(accounts); 
            console.log("SERALIZED: ", accounts);
            return (

                <div>
                    <h4> Account Details </h4>
                    <BootstrapTable
                        data = {accounts}
                        striped={true}
                        hover={true}
                        pagination={true}
                        search={true}
                    >
                        <TableHeaderColumn 
                            dataField="name" 
                            isKey={true}  
                            dataFormat={this.formatAccountId}
                            >
                            Account Name
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="balances_0_currency" 
                            >
                            Currency
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="balances_0_balance" 
                            >
                            Balance
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
        email: state.wepay_user.searchedUser,
        error: state.errors.info
    }
}

AccountBlock = connect(mapStateToProps)(AccountBlock);



export default AccountBlock
