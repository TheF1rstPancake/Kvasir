/**
 * Object for displaying checkouts and handeling all actions that someone might want to perform on a checkout, including refunds.
 * 
 * The checkouts are displayed in a table, and every checkout can have a refund initiated on it (unless a full refund has already been given).
 * Clicking the refund button will fire off a Bootstrap modal that will overlay the screen. Here the user has the opportunity to enter how much they want the refund to be for and initiate the refund.
 * If the refund is successful, a message will appear at the bottom of the modal.  
 * Exiting out of the modal will allow the user to continue perfomring other actions.
 * Once the checkout is complete, the checkout object will be re-fetched from WePay and the table will reflect the changes to the object.
 *
 * NOTE:    Exiting the modal after pressing submit does not kill the refund.  
 *          Once that process has started it will continue to the end 
 *
 */

import React, { PropTypes } from 'react'
import {Grid, Form, Label, FormGroup, FormControl, Row, Col, ControlLabel, Table, Button, Modal, Radio} from "react-bootstrap"
import { connect } from 'react-redux'
import {BootstrapTable} from "react-bootstrap-table"

import {fetchRefundIfNeeded, clearRefund, fetchCheckoutIfNeeded, searchCheckout} from "../actions/checkouts"
import {searchUser, fetchUserIfNeeded} from "../actions/user"
import {fetchAccountIfNeeded} from "../actions/accounts"
import {fetchCardIfNeeded, searchCard} from "../actions/credit_card"

import {clearError} from "../actions/errors"

import Base from "./Base"

var Checkouts = React.createClass({
    /**
     * Get the initial state of the checkouts object
     * We initially do not want to show the refund modal, and we also don't have a refund currently happeing
     * We also keep the "selectRowProp" here which defines the behavior when a checkbox is clicked on a given row in the payer checkout table
     */
    getInitialState: function() {
        return {
            showModal: false,
            refund: {
                selectedCheckoutId: null,
                refundAmount: 0,
                refundReason: "",
            },
            selectRowProp: {
                mode: "radio",
                clickToSelect: false,   // the user has to explicitly click the checkbox
                bgColor: "rgb(249, 255, 172)",
                onSelect: this.handlePayerCheckoutSelect
            }
        }
    },
    /**
     * Fetch more checkouts for a given account.  Right now, we fetch checkouts in batches of 50 at a time
     * The button that attachs to this function allows the user to grab the next batch and add them to the table
     *
     * @params event -  the event that triggered the function (most likely a button click) 
     */
    fetchMoreCheckouts: function(event) {
        console.log("Fetching more checkouts for: ", this.props.account_id);
        var start = this.props.checkoutInfo.length;
        this.props.dispatch(fetchCheckoutIfNeeded(this.props.account_id, null, start));
    },
    /**
     * Function that handles a user clicking on a checkbox in the payer checkout table
     * This function will get the information about that particular row and then:
     *  1) get the merchant's access token
     *  2) get the merchant's account details
     *  3) make a call to the WePay API to get additional information about the checkout so that the user can perform a refund.
     *
     * @param row -            the row that was selected
     * @param isSelected -     boolean that is true if this is the selected row
     */
    handlePayerCheckoutSelect: function(row, isSelected) {
        // set the account 
        event.preventDefault();
        var account_id = row.account_id;
        var checkout_id = row.checkout_id;
        var this2 = this;

        // fetch the user info and after the user info is fetched, get the account error
        this.props.dispatch(fetchUserIfNeeded(null, account_id,
                function(){
                    this2.props.dispatch(fetchAccountIfNeeded(null, account_id));
                    this2.props.dispatch(fetchCheckoutIfNeeded(account_id, checkout_id));
                }
        ));
    },
    /**
     * Within the refund modal, there are two ways to set the refund amount
     * The user can modify the *amount* field to enter a dollar amount
     * Or use the *percent* field to set the refund based on a percentage of the remaining amount
     * Upadting the amount field will update the percent field and vice-versa
     *
     * This function defines the behavior for updating the amount field
     * NOTE:    this function uses JQUERY to update the fields.
     *          if we used the state object, changing the field would update the entire checkout object which is undesirable
     *
     * @param event    -   the event that caused the function to be fired
     */
    handleAmountChange: function(event) {
        var currentPercent = $("#refundPercentage");
        var refundAmount = event.target.value; 
        var maxRefundableAmount = $("#refundAmount").prop("max");
        currentPercent.val(((refundAmount*100)/maxRefundableAmount).toFixed(2));

    },
    /**
     * Handle the percent field changing
     *
     * @param event     -   the event that cause the function to be fired
     */
    handlePercentChange: function(event) {
        var currentAmount = $("#refundAmount");
        var currentPercent = event.target.value;
        var maxRefundableAmount = $("#refundAmount").prop("max");

        // change the refund amount based on the percent value that the user has entered
        // this is designed to make the refund easier.  If their policy is to refund half, this takes away the guess work
        currentAmount.val((maxRefundableAmount * (currentPercent/100.0)).toFixed(2));

    },
    /**
     * Handle the user selecting a given Payment ID
     * This will dispatch an action to fetch the credit card info from the WePay API
     *
     * @param event - the event that caused the function to be fired.  The tokenized ID should be the ID of the DOM element that had this function attached to it.
     */
    handlePaymentIDSelect: function(event) {
        event.preventDefault();
        var credit_card_id = parseInt(event.target.id);

        this.props.dispatch(searchCard(credit_card_id));
        this.props.dispatch(fetchCardIfNeeded(credit_card_id));
    },
    /**
     * Refund a checkout
     *
     * It's a little more complicated than that.
     * For any given checkout we need to have a:
     *  refundAmount - the amount that we are refunding
     *  refundReason - the reason that we are refunding
     *
     * The allowable amounts are also dependent on who the "fee_payer" of the checkout is
     *
     * At the end, this function will dispatch an event to refund the checkout
     */
    refundCheckout: function(e) {
        e.preventDefault();
        console.log("Performing refund for: ", this.state.refund.selectedCheckoutId);

        var checkout_id = this.state.refund.selectedCheckoutId;
        var refundAmount = $("#refundAmount").val();
        var refundReason = $("#refundReason").val();
        var maxRefundableAmount = $("#refundAmount").prop("max");

        console.log(refundAmount, maxRefundableAmount);

        if (refundAmount - maxRefundableAmount == 0) {
            console.log("Full refund!");
            refundAmount = null;
        }
        var current = this.state.refund;
        current['refundAmount'] = refundAmount;
        current['refundReason'] = refundReason;
        this.setState({refund:current})

        this.props.dispatch(fetchRefundIfNeeded(checkout_id, refundAmount, refundReason));
    },
    /**
     * Format payment_ids
     *
     * Turns each payment_id into a clickable link.  Clicking that link will fire `handlePaymentIDSelect`.
     * That function will go and gather the information about the tokenized id and display it in a table
     */
    formatPaymentID: function(cell, row) {
        return (<a href="#credit_card_table" id={cell} onClick={this.handlePaymentIDSelect}>{cell}</a>)
    },
    /**
     * Format the refund button
     *
     * The refund button has several different formats depending on whether or not a refund has already been performed.
     * 
     * If **no** refund has been performed, it's just a button
     * If a **partial** refund has been performed, it's the button AND the amount that was refunded, along with the reason for the refund
     * If a **full** refund has been performed, then there is no button, and only the amount and reason are displayed.
     */
    formatRefund: function(cell, row) {
        // cell is the refund_amount_refunded value.  If this is less than the amount of the original checkout then we want to include a refund button
        // if the value is greater than 0, then someone initiated a refund, so we want to include the reason for the refund and how much it was
        var d = null;
        var refundString = (<p><strong>Refunded</strong>: ${cell}<br></br>{row.refund_refund_reason}</p>);
        var refundButton = (<Button bsStyle="primary" bsSize="small" id={row.checkout_id} onClick={this.openModal}>Refund</Button>)
        if (cell > 0) {
            if (cell >= row.amount) {
                return (<div>{refundString}</div>)
            }
            else {
                return (<div>
                    {refundString}
                    {refundButton}
                    </div>);
                
            }
        }
        return  (<div>{refundButton}</div>);

    },
    /**
     * React-bootstrap-table requires that all data be in a list of flat dictionaries.
     * We cannot have nested values, so this function will pass everything into `Base.flatten()` in order to create flat dicitionaries.
     *
     * @param info -    a list of dictionaries, which may have nested dictionaries or lists under it
     */
    serialize: function(info) {
        var array = [];

        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    /**
     * Open the refund modal
     *
     * Modify the state of this object to show the refund modal and tell us which checkout has been selected for the refund
     *
     * @param event     -   the event that fired the function.  The id of the DOM element attached to this function should be the checkout_id
     */
    openModal: function(event) {
        this.setState({showModal:true, refund:{selectedCheckoutId: event.target.id}});
        this.props.dispatch(searchCheckout(null, this.state.refund.selectedCheckoutId));
        this.props.dispatch(clearError("refund"));
    },
    /**
     * Close the refund modal
     *
     * Closing the modal will clear the refund state, as well as the information put into this state by `openModal`
     */
    closeModal: function() {
        this.props.dispatch(clearRefund());
        this.setState({showModal:false, refund:{}});
    },
    /**
     * Build the modal
     *
     * This will return the DOM for rendering the modal in the page.
     * It will only return the modal if there are valid checkouts.  Without any checkouts, there is no point in building it.
     */
    buildModal: function() {
        var checkout = null;
        var checkout_list = this.props.checkoutInfo;

        console.log("checkout_list: ", checkout_list);
        if (checkout_list.length <= 0) {
            return (<div></div>);
        }

        for (var i = 0; i < checkout_list.length; i++) {
            if(checkout_list[i].checkout_id == this.state.refund.selectedCheckoutId) {
                checkout = checkout_list[i];
                break;
            }
        }
        
        // if no checkout exists, then don't build the modal
        if (checkout == null) {
            return (<div></div>);
        }

        // otherwise build it
        var maxRefundableAmount = (checkout.amount - checkout.refund.amount_refunded);
        var successful_refund;
        if (this.props.successful_refund) {
            successful_refund = (<h3><Label bsStyle="success">Refund completed!</Label></h3>);
        }
        else if (this.props.refund_error) {
            successful_refund = (<h3><Label bsStyle="warning">{this.props.refund_error.error_message}</Label></h3>);
        }
        return (
            <div>
            <Modal show = {this.state.showModal} onHide = {this.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Refund Checkout</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p><strong>Max Refundable Amount:</strong> ${maxRefundableAmount}</p>
                <Form horizontal onSubmit={this.refundCheckout}>
                    <FormGroup>
                        <Col lg={6} ms={12}>
                            <ControlLabel>Refund Amount</ControlLabel>
                            <FormControl 
                                type="number" 
                                id="refundAmount"
                                step="0.01"
                                max={maxRefundableAmount}
                                ref = "refundAmount"
                                onChange = {this.handleAmountChange}
                                required
                                />
                        </Col>
                        <Col lg={6} ms={12}>
                            <ControlLabel>Refund Percentage</ControlLabel>
                            <FormControl
                                type="number"
                                id="refundPercentage"
                                step="0.01"
                                max="100"
                                onChange={this.handlePercentChange}
                            />    
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col lg={12}>
                            <ControlLabel>Refund Reason</ControlLabel>    
                            <FormControl
                                type="text"
                                id="refundReason"
                                required/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col lg={12}>
                        {successful_refund}
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col lg={12}>
                        <Button type="submit" bsStyle="success" value="Submit Refund" disabled={this.props.submitted_refund}>Submit Refund</Button>
                        </Col>
                    </FormGroup>
                </Form>
                </Modal.Body>
            </Modal>
            </div>
            );
    },
    /**
     * Render the checkout object
     *
     * This function renders both the checkout table where data is collected from the WePay API for a given account, and the payer table where a list of a payer's checkouts are collected from the partner middleware.
     *
     * The checkout table takes precedence.  If we have a list of checkouts (this.props.checkoutInfo) then we render the checkout table with that info.
     * 
     * If the checkout info is not available, then we check to see if the payer info is.  If it is, then we render that info.
     *
     * If neither of these objects are available, then we simply render nothing.
     *
     * The checkout table has a lot more information in it because it's gathering information from the WePay API, which we can rely on to give us more data everytime.
     * The payer table has much less data but enough to eventually back track and render the checkout table
     *
     * NOTE:    selecting a checkout in the payer table will eventually cause that checkout to be fetched and put in the checkout table
     *          in these cases, the only checkout in the checkout table is the one selected from the payer table
     */
    render: function() {
        if(!(this.props.checkoutInfo === undefined)){
            var checkouts = this.serialize(this.props.checkoutInfo);
            console.log('Rendering checkout info gathered from WePay');
            return (
                <div id="checkouts_table">
                <Row>
                    <h4> Checkouts </h4>
                    <BootstrapTable
                        data={checkouts}
                        striped={true}
                        hover={true}
                        pagination={true}
                        search={true}
                        >
                        <TableHeaderColumn 
                            dataField="checkout_id" 
                            isKey={true}  
                            dataFormat={this.formatCheckoutID}
                            >
                            Checkout ID
                        </TableHeaderColumn>    
                        <TableHeaderColumn 
                            dataField = "create_time"
                            dataFormat={Base.formatDate}
                            dataSort={true}
                            >
                            Date
                        </TableHeaderColumn>   
                        <TableHeaderColumn 
                            dataField = "soft_descriptor"
                            >
                            Descriptor
                        </TableHeaderColumn>  
                        <TableHeaderColumn 
                            dataField = "amount"
                            >
                            Amount ({checkouts[0] ? checkouts[0].currency : "Currency"})
                        </TableHeaderColumn>   
                        <TableHeaderColumn
                            dataField="gross"
                            >
                            Gross Amount ({checkouts[0] ? checkouts[0].currency : "Currency"})
                        </TableHeaderColumn> 
                        <TableHeaderColumn 
                            dataField = "payer_email"
                            >
                            Payer Email
                        </TableHeaderColumn>   
                        <TableHeaderColumn 
                            dataField = "payer_name"
                            >
                            Payer Name
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField = "payment_method_credit_card_id"
                            dataFormat = {this.formatPaymentID}
                            >
                            Payment Method
                        </TableHeaderColumn>
                        <TableHeaderColumn
                            dataField = "refund_amount_refunded"
                            dataFormat = {this.formatRefund}
                            >
                            Refund
                        </TableHeaderColumn> 
                    </BootstrapTable>
                    </Row>
                    <Row>
                        <div className="pull-right">
                            <Button 
                                id="fetchMoreCheckouts"
                                onClick = {this.fetchMoreCheckouts}
                                bsStyle="primary"
                            >Get More Checkouts</Button>
                        </div>
                    </Row>
                    {this.buildModal()}
                </div>
            );
        }
        else if(!(this.props.payerInfo === undefined)) {
            if (this.props.isFetching) {
                return Base.isFetchingSpinner();
            }
            console.log("Rendering checkout info gathered from partner database");
            return (<div id="payer_checkouts_table">
                <Row>
                    <h4>Payer Checkouts</h4>
                    <BootstrapTable
                        data={this.props.payerInfo}
                        striped={true}
                        hover={true}
                        pagination={true}
                        search={true}
                        selectRow={this.state.selectRowProp}
                        >
                        
                        <TableHeaderColumn 
                            dataField="checkout_id" 
                            isKey={true}  
                            dataFormat={this.formatCheckoutID}
                            >
                            Checkout ID
                        </TableHeaderColumn>    
                        <TableHeaderColumn 
                            dataField = "create_time"
                            dataSort={true}
                            >
                            Date
                        </TableHeaderColumn> 
                        <TableHeaderColumn
                            dataField = "credit_card_id"
                            dataFormat = {this.formatPaymentID}
                            >
                            Credit Card ID
                        </TableHeaderColumn>   
                        <TableHeaderColumn 
                            dataField = "amount"
                            >
                            Amount
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="account_id"
                            >
                            Account ID
                        </TableHeaderColumn>
                    </BootstrapTable>
                    </Row>
            </div>);
        }
        
        return (<div></div>);
    }
});

/**
 * Map the Redux state to props on this object
 *
 * checkoutInfo:        a list of checkout(s) gathered from the WePay API by dispatching actions from /actions/checkouts
 * account_id:          the account_id that is currently selected from the accounts object
 * submitted_refund:    a flag indiciating if we are currently in the process of submitting a refund.  
 *                      This allows us to disable the "Submit Refund" button in the refund modal
 * successful_refund:   a flag indiciation if the last refund we attempted went through successfully
 * refund_error:        part of the error object generated by /actions/error and /reducers/error.  This object just mointors errors that are caused by refunds
 * payerInfo:           a list of checkout(s) gathered from the partner middleware using the payer's email as the search parameter
 * isFetching:          true if either the payer object or checkout object is currently fetching data  
 */
const mapStateToProps = (state) => {
    return {
        checkoutInfo:       state.wepay_checkout.checkout.checkoutInfo,
        account_id:         state.wepay_account.searchedAccount.account_id,
        submitted_refund:   state.wepay_checkout.checkout.submitted_refund,
        successful_refund:  state.wepay_checkout.checkout.successful_refund,
        refund_error:       state.errors.refund ? state.errors.refund.info: {},
        payerInfo:          state.wepay_payer.payer.payerInfo,
        isFetching:         state.wepay_payer.payer.isFetching || state.wepay_checkout.checkout.isFetching

    }
}

Checkouts = connect(mapStateToProps)(Checkouts);


export default Checkouts
