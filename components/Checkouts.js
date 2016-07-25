/**
 * Object for displaying checkouts and handeling all actions that someone might want to perform on a checkout, including refunds.
 * 
 * The checkouts are displayed in a table, and every checkout can have a refund initiated on it (unless a full refund has already been given).
 * Clicking the refund button will fire off a Bootstrap modal that will overlay the screen. Here the user has the opportunity to enter how much they want the refund to be for and initiate the refund.
 * If the refund is successful, a message will appear at the bottom of the modal.  
 * Exiting out of the modal will allow the user to continue perfomring other actions.
 * Once the checkout is complete, the checkout object will be re-fetched from WePay and the table will reflect the changes to the object.
 *
 * NOTE: Exiting the modal after pressing submit does not kill the refund.  Once that process has started it will continue to the end 
 *
 */

import React, { PropTypes } from 'react'
import {Grid, Form, Label, FormGroup, FormControl, Row, Col, ControlLabel, Table, Button, Modal} from "react-bootstrap"
import { connect } from 'react-redux'
import {BootstrapTable} from "react-bootstrap-table"

import {fetchRefundIfNeeded, clearRefund, fetchCheckoutIfNeeded, searchCheckout} from "../actions/checkouts"
import {searchUser, fetchUserIfNeeded} from "../actions/user"
import {fetchAccountIfNeeded} from "../actions/accounts"

import Base from "./Base"

var Checkouts = React.createClass({
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
                clickToSelect: true,
                bgColor: "rgb(249, 255, 172)",
                onSelect: this.handlePayerCheckoutSelect
            }
        }
    },
    handlePayerCheckoutSelect: function(event) {
        // set the account 
        event.preventDefault();
        var account_id = event.target.id;
        var this2 = this;

        // fetch the user info and after the user info is fetched, get the account error
        this.props.dispatch(fetchUserIfNeeded(null, account_id,
                function(){
                    this2.props.dispatch(fetchAccountIfNeeded(account_id))
                }
        ));
    },
    openModal: function(event) {
        this.setState({showModal:true, refund:{selectedCheckoutId: event.target.id}});
        this.props.dispatch(searchCheckout(this.props.email, null, this.state.refund.selectedCheckoutId));
    },
    closeModal: function() {
        this.props.dispatch(clearRefund());
        this.setState({showModal:false, refund:{}});
    },
    buildModal: function() {
        var checkout = null;
        var checkout_list = this.props.payerInfo? this.props.payerInfo : this.props.checkoutInfo

        for (var i = 0; i < checkout_list.length; i++) {
            if(checkout_list[i].checkout_id == this.state.refund.selectedCheckoutId) {
                checkout = checkout_list[i];
                break;
            }
        }
        
        // if no checkout exists, then don't build the modal
        if (!checkout) {
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
    handleAmountChange: function(event) {
        var currentPercent = $("#refundPercentage");
        var refundAmount = event.target.value; 
        var maxRefundableAmount = $("#refundAmount").prop("max");
        currentPercent.val(((refundAmount*100)/maxRefundableAmount).toFixed(2));

    },
    handlePercentChange: function(event) {
        var currentAmount = $("#refundAmount");
        var currentPercent = event.target.value;
        var maxRefundableAmount = $("#refundAmount").prop("max");

        // change the refund amount based on the percent value that the user has entered
        // this is designed to make the refund easier.  If their policy is to refund half, this takes away the guess work
        currentAmount.val((maxRefundableAmount * (currentPercent/100.0)).toFixed(2));

    },
    handleReasonChange: function(event) {
        var current = this.state.refund;
        current.refundReason = event.target.value; 
        this.setState({refund: current})
    },
    fetchMoreCheckouts: function(event) {
        console.log("Fetching more checkouts for: ", this.props.email, this.props.account_id);
        var start = this.props.checkoutInfo.length;
        this.props.dispatch(fetchCheckoutIfNeeded(this.props.email, this.props.account_id, null, start));
    },
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

        this.props.dispatch(fetchRefundIfNeeded(this.props.email, checkout_id, refundAmount, refundReason));
    },
    formatAccountID: function(cell,row) {
         return (<a href='#' id={cell} onClick={this.handlePayerCheckoutSelect}>{cell}</a>);
    },
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

    serialize: function(info) {
        var array = [];

        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    render: function() {
        if(this.props.payerInfo != null) {
            var refund_column;

            
                refund_column = (<TableHeaderColumn
                    dataField = "refund_amount_refunded"
                    dataFormat = {(this.props.account_id) ? this.formatRefund : function(cell){return cell}}
                    >
                    Refund
                </TableHeaderColumn>); 

            return (<div>
                <Row>
                    <h4>Payer Checkouts</h4>
                    <BootstrapTable
                        data={this.props.payerInfo}
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
                            dataField = "amount"
                            >
                            Amount
                        </TableHeaderColumn>
                        <TableHeaderColumn 
                            dataField="account_id"
                            dataFormat = {this.formatAccountID}
                            >
                            Account ID
                        </TableHeaderColumn>
                        {refund_column ? refund_column : null}
                    </BootstrapTable>
                    {this.buildModal()}
                    </Row>
            </div>);
        }
        else if(this.props.checkoutInfo != null){
            var checkouts = this.serialize(this.props.checkoutInfo);
            return (
                <div>
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
                            Amount ({checkouts[0].currency})
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
        
        return (<div></div>);
    }
});

const mapStateToProps = (state) => {
    return {
        checkoutInfo:       state.wepay_checkout.checkout.checkoutInfo,
        email:              state.wepay_user.searchedUser.email,
        account_id:         state.wepay_account.searchedAccount.account_id,
        submitted_refund:   state.wepay_checkout.checkout.submitted_refund,
        successful_refund:  state.wepay_checkout.checkout.successful_refund,
        error:              state.errors.global ? state.errors.global.info : {},
        refund_error:       state.errors.refund ? state.errors.refund.info: {},
        payerInfo:          state.wepay_payer.payer.payerInfo

    }
}

Checkouts = connect(mapStateToProps)(Checkouts);


export default Checkouts
