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
        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    serializeReserves: function(info) {
        var array = [];
        for (var i = 0; i < info.withdrawals_schedule.length; i++) {
            var f = Base.flatten(info.withdrawals_schedule[i]);
            f.account_id = info.account_id;
            f.reserved_amount = info.reserved_amount;
            f.currency = info.currency;
            array.push(f);
        }
        return array;
    },
    formatBank: function(cell, row) {
        return row.bank_data_bank_name + " XXXXXX" + cell;
    },
    formatState:function(cell, row) {
        if (cell == "captured") {
            return (<div>{cell}<br></br>{Base.formatDate(row.withdrawal_data_capture_time)}</div>);
        }
        else if(cell == "started") {
            return (<div>{cell}<br></br>{Base.formatDate(row.withdrawal_data_create_time)}</div>);
        }
        return (<div>{cell}</div>);
    },
    render: function() {
        var withdrawals = this.props.withdrawalInfo;
        var reserve = this.props.reserveInfo;
        var withdrawal_content = (<div></div>);
        var reserve_content = (<div></div>);
        var this2 = this;
        if (this.props.isFetching) {
            return (<div><object data="/static/css/default_spinner.svg" type="image/svg+xml" width="150px"></object></div>);
        }
        if (this.props.withdrawalInfo === undefined || $.isEmptyObject(this.props.error) == false){
            withdrawal_content = withdrawal_content;
        }
        else {
            withdrawals = this.serializeWithdrawals(withdrawals);
            withdrawal_content = (
                <div>
                    <h4>Withdrawals</h4>
                    <BootstrapTable
                        data={withdrawals}
                        striped={true}
                        hover={true}
                        pagination={true}
                    >
                        <TableHeaderColumn 
                            dataField="withdrawal_id" 
                            isKey={true}  
                            dataFormat={this.formatWithdrawalId}
                            >
                            Withdrawal ID
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="amount" 
                            >
                            Amount ({withdrawals[0] ? withdrawals[0].currency : "Currency"})
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="state"
                            dataSort={true} 
                            dataFormat={this.formatState}
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

        if(reserve == null || $.isEmptyObject(this.props.error) == false){
            reserve_content = reserve_content;
        }
        else {
            reserve = this.serializeReserves(reserve);
            console.log("RESERVES: ", reserve);
            reserve_content = (
                <div>
                    <h4>Reserves</h4>
                    <BootstrapTable
                        data={reserve}
                        striped={true}
                        hover={true}
                        pagination={true}
                    >
                        <TableHeaderColumn 
                            dataField="account_id" 
                            isKey={true}  
                            >
                            Account ID
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField = "reserved_amount"
                            >
                            Total Reserved ({reserve[0].currency})
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="amount"
                            >
                            Next Withdrawal Amount
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="time"
                            dataFormat={Base.formatDate}
                            >
                            Next Withdrawal Date
                        </TableHeaderColumn>
                    </BootstrapTable>
                </div>
            )
        }
        return (<div id="withdrawal_reserve">{withdrawal_content}{reserve_content}</div>);
    }
});


const mapStateToProps = (state) => {
    return {
        withdrawalInfo:     state.wepay_withdrawal.withdrawal.withdrawalInfo,
        reserveInfo:        state.wepay_withdrawal.withdrawal.reserveInfo,
        email:              state.wepay_user.searchedUser,
        error:              state.errors.global ? state.errors.global.info : {},
        isFetching:         state.wepay_withdrawal.withdrawal.isFetching

    }
}

Withdrawals = connect(mapStateToProps)(Withdrawals);



export default Withdrawals
