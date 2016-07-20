/**
 * Withdrawal object.  This is responsible for displaying and managing actions for withdrawals tied to a given account_id.
 * The information contained in each withdrawal object is minimal.  The most important aspect is likely the "withdrawal_uri" which is a link the merchant can go to in order to see more information about a particular withdrawal.
 * This link is WePay hosted so they will have to use their WePay login credentials to get to it, but that shouldn't be a problem.
 * These links are not typically exposed to the merchants by partners, but giving their support people access to them should help them solve some issues with withdrawals.
 *
 */
import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table} from "react-bootstrap"
import { connect } from 'react-redux'
import {addCheckouts} from "../actions/checkouts"
import {BootstrapTable} from "react-bootstrap-table"

import Base from "./Base"

var Withdrawals= React.createClass({
    getInitialState: function() {
        return {
            error: ""
        }
    },
    formatWithdrawalId: function(cell, row) {
        return "<a target='_blank' href="+ row.withdrawal_data_withdrawal_uri + " id=" + cell + ">" + cell + "</a>";

    },
    serializeWithdrawals: function(info) {
        var array = [];

        console.log("BASE: ", Base);

        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    formatBank: function(cell, row) {
        return row.bank_data_bank_name + " XXXXXX" + cell;
    },
    render: function() {
        var withdrawals = this.props.withdrawalInfo;
        console.log("WITHDRAWALS: ", withdrawals);
        var this2 = this;
        if (withdrawals == null || $.isEmptyObject(this.props.error) == false){
            return (<div></div>);
        }
        else {
            withdrawals = this.serializeWithdrawals(withdrawals)
            return (
                <div>
                    <h4>Withdrawals </h4>
                    <BootstrapTable
                        data={withdrawals}
                        striped={true}
                        hover={true}
                        pagination={true}
                        search={true}
                    >
                        <TableHeaderColumn 
                            dataField="withdrawal_id" 
                            isKey={true}  
                            dataFormat={this.formatWithdrawalId}
                            >
                            Withdrawal ID
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="currency" 
                            >
                            Currency
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="state" 
                            >
                            State
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="bank_data_account_last_four" 
                            dataFormat={this.formatBank}
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
        withdrawalInfo: state.wepay_withdrawal.withdrawal.withdrawalInfo,
        email: state.wepay_user.searchedUser,
        error: state.errors.global ? state.errors.global.info : {}

    }
}

Withdrawals = connect(mapStateToProps)(Withdrawals);



export default Withdrawals
