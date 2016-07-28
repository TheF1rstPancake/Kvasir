/**
 * Component for rendering credit card info.
 * Given a tokenized credit card ID, a user might want to gather more information abou the card.
 * This requires taking that token and making a v2/credit_card call.
 */

import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table} from "react-bootstrap"
import { connect } from 'react-redux'
import {clearCard, fetchCardIfNeeded} from "../actions/credit_card"
import {addError} from "../actions/errors"
import {BootstrapTable} from "react-bootstrap-table"

import {searchAccount} from "../actions/accounts"

import Base from "./Base"

var CreditCardBlock= React.createClass({
    getInitialState: function() {
        return {
            accountInfo: {},
            error: {}
        }
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
    formatExpriation: function(cell, row) {
        return <div>{cell}/{row.expiration_year}</div>
    },
    render: function() {
        var card = this.props.cardInfo;
        var this2 = this;
        if (this.props.isFetching) {
            return (<div><object data="/static/css/default_spinner.svg" type="image/svg+xml" width="150px"></object></div>);
        }
        else if (card == null || $.isEmptyObject(card)  || $.isEmptyObject(this.props.error)==false) {
            return (<div></div>);
        }
        else {
            // put the card in a list
            card = [card];
            return (
                <div id="credit_card_info">
                    <h4>Card Details </h4>
                    <BootstrapTable
                        data = {card}
                        striped={true}
                        hover={true}
                    >
                        <TableHeaderColumn 
                            dataField="credit_card_id" 
                            isKey={true}
                            >
                            Credit Card ID
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="create_time"
                            dataFormat = {Base.formatDate}
                            >
                            Create Time
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField="credit_card_name"
                            >
                            Card Name
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="user_name" 
                            >
                            Owner Name
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="expiration_month" 
                            dataFormat = {this.formatExpriation}
                            >
                            Expiration Date
                        </TableHeaderColumn>
                    </BootstrapTable>
                </div>
            );
        }
    }
});


const mapStateToProps = (state) => {
    return {
        cardInfo:           state.wepay_card.card.cardInfo,
        isFetching:         state.wepay_card.card.isFetching,
        searchedCard:       state.wepay_card.searchedCard,
        haveAccessToken:    state.wepay_user.user.haveAccessToken,
        error:              state.errors.global ? state.errors.global.info : {}
    }
}

CreditCardBlock = connect(mapStateToProps)(CreditCardBlock);



export default CreditCardBlock
