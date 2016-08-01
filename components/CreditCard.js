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
    /**
     * Get initial state for the credit_card object
     * 
     * There is no initial state info, so return an empty object
     */
    getInitialState: function() {
        return {};
    },
    /**
     * Format the expiration date of the card so that it is MM/YYYY
     *
     * @param cell  - the cell that contains the expiration month
     * @param row   - the entire row that this cell belongs to.  The YYYY can be gathered from row.expiration_year
     */
    formatExpriation: function(cell, row) {
        return <div>{cell}/{row.expiration_year}</div>
    },
    /**
     * Render the credit card table.
     *
     * This will show information about a tokenized card gathered by making a call to WePay's /credit_card endpoint
     */
    render: function() {
        var card = this.props.cardInfo;
        var this2 = this;
        if (this.props.isFetching) {
            return Base.isFetchingSpinner();
        }
        else if (card == null || $.isEmptyObject(card)  || $.isEmptyObject(this.props.error)==false) {
            return (<div></div>);
        }
        else {
            // put the card in a list
            card = [card];
            return (
                <div id="credit_card_table">
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

/**
 * Map Redux state to properties for this object
 *
 * cardInfo:        list that contains a dictionary that describes the credit card
 * isFetching:      true if we are currently fetching information about the card
 * searchedCard:    the tokenized id of the credit card for which we are currently looking up/rendering
 * error:           errors created by /actions/credit_card and /reducer/credit_card
 */
const mapStateToProps = (state) => {
    return {
        cardInfo:           state.wepay_card.card.cardInfo,
        isFetching:         state.wepay_card.card.isFetching,
        searchedCard:       state.wepay_card.searchedCard,
        error:              state.errors.credit_card ? state.errors.credit_card.info : {}
    }
}

CreditCardBlock = connect(mapStateToProps)(CreditCardBlock);



export default CreditCardBlock
