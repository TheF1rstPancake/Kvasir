/**
 * Component for rendering credit card info.
 * Given a tokenized credit card ID, a user might want to gather more information abou the card.
 * This requires taking that token and making a v2/credit_card call.
 */

import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table, Button, Modal,Label } from "react-bootstrap"
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
        return {showModal: false, searchedPreapproval:null, cancelResponse:""};
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
    formatPreapprovalId: function(cell, row){
        return (<a href={row.manage_uri} id={cell} target="_blank">{cell}</a>)

    },
    formatRecurring: function(cell, row) {
        if (row.state) {
            return <div>{row.state}</div>
        }
        return (<div>{cell}<br></br><Button bsStyle="danger" bsSize="small" id={row.preapproval_id} onClick={this.openModal}>Cancel</Button></div>)
    },
    cancelPreapproval: function(event) {
        var preapproval_id = this.state.searchedPreapproval;
        var this2 = this;
        $.post("/preapproval/cancel", {"preapproval_id":preapproval_id})
            .fail(function(data) {
                console.log("ERROR WITH CANCELATION: ", data);
                this2.setState({
                    cancelResponse:(<h3><Label bsStyle="warning"> {data.responseJSON.error_description}</Label></h3>)
                });
            })
            .done(function(data){
                this2.setState(
                    {cancelResponse: (<h3><Label bsStyle="success">Cancel successful!</Label></h3>)}
                );
            });    
    },
     /**
     * Open the refund modal
     *
     * Modify the state of this object to show the refund modal and tell us which checkout has been selected for the refund
     *
     * @param event     -   the event that fired the function.  The id of the DOM element attached to this function should be the checkout_id
     */
    openModal: function(event) {
        this.setState({showModal:true, searchedPreapproval:event.target.id});

    },
    /**
     * Close the refund modal
     *
     * Closing the modal will clear the refund state, as well as the information put into this state by `openModal`
     */
    closeModal: function() {
        this.setState({showModal:false, searchedPreapproval:null, cancelResponse:null});
    },
    /**
     * Build the modal
     *
     * This will return the DOM for rendering the modal in the page.
     * It will only return the modal if there are valid checkouts.  Without any checkouts, there is no point in building it.
     */
    buildModal: function() {
        console.log(this.state);
        return (<div>
            <Modal show = {this.state.showModal} onHide = {this.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Cancel Preapproval</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to cancel this preapproval?  This action cannot be undone.
                    <br></br>
                    {this.state.cancelResponse}
                    <br></br>
                    <Button bsStyle="success" onClick={this.cancelPreapproval}>Confirm Cancellation</Button>
                </Modal.Body>
            </Modal>
        </div>);
    },
    renderPreapprovals: function() {
        var preapproval = this.props.cardInfo; 
        preapproval = [preapproval];
        return (
            <div id="preapproval_table">
                <h4>Preapproval Details </h4>
                <BootstrapTable
                    data = {preapproval}
                    striped={true}
                    hover={true}
                >
                    <TableHeaderColumn 
                        dataField="preapproval_id" 
                        isKey={true}
                        dataFormat={this.formatPreapprovalId}
                        >
                        Preapproval ID
                    </TableHeaderColumn>
                    <TableHeaderColumn
                        dataField="create_time"
                        dataFormat = {Base.formatDate}
                        >
                        Create Time
                    </TableHeaderColumn>
                    <TableHeaderColumn
                        dataField="period"
                        >
                        Period
                    </TableHeaderColumn>
                   
                    <TableHeaderColumn 
                        dataField="payer_name" 
                        >
                        Name
                    </TableHeaderColumn>
                    <TableHeaderColumn
                        dataField="payer_email"
                        >
                        Email
                    </TableHeaderColumn>
                     <TableHeaderColumn 
                        dataField="auto_recur"
                        dataFormat = {this.formatRecurring}
                        >
                        Recurring
                    </TableHeaderColumn>
                </BootstrapTable>
                <hr></hr>
            </div>
        );
    },
    renderCreditCard: function() {
        var card = this.props.cardInfo;
        var this2 = this;
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
                <hr></hr>
            </div>
        );
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
        
        // now that we know that payment info exists, we need to check what kind it is
        var payment_table = null;
        if (this.props.paymentType == "credit_card"){
            payment_table =  (<div id="payment_method_table">{this.renderCreditCard()}</div>);

        }
        else if(this.props.paymentType == "preapproval") {
            payment_table= (<div id="payment_method_table">{this.renderPreapprovals()}</div>);
        }
        else {
            payment_table= (<div id="payment_method_table">Do not recognize payment method: {this.props.paymentType}</div>);
        }
        return (<div>{payment_table}<br></br>{this.buildModal()}</div>);
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
        paymentType:        state.wepay_card.card.requestType,
        isFetching:         state.wepay_card.card.isFetching,
        searchedCard:       state.wepay_card.card.cc_id,
        error:              state.errors.credit_card ? state.errors.credit_card.info : {}
    }
}

CreditCardBlock = connect(mapStateToProps)(CreditCardBlock);



export default CreditCardBlock
