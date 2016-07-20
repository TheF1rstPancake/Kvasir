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
        error: state.errors.info
    }
}

Withdrawals = connect(mapStateToProps)(Withdrawals);



export default Withdrawals
