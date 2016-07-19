import React, { PropTypes } from 'react'
import {Grid, Label, FormGroup, FormControl, Row, Col, ControlLabel, Table, Button, Modal} from "react-bootstrap"
import { connect } from 'react-redux'
import {BootstrapTable} from "react-bootstrap-table"

import {fetchRefundIfNeeded, clearRefund} from "../actions/checkouts"

import Base from "./Base"

var Checkouts = React.createClass({
    getInitialState: function() {
        return {
            showModal: false,
            refund: {
                selectedCheckoutId: null,
                refundAmount: 0,
                refundReason: "",
            }
        }
    },
    openModal: function(event) {
        console.log("OPENING MODAL", event.target.id);
        this.setState({showModal:true, refund:{selectedCheckoutId: event.target.id}});
    },
    closeModal: function() {
        this.props.dispatch(clearRefund());
        this.setState({showModal:false, refund:{}});
    },
    buildModal: function() {
        var checkout = null;
        for (var i = 0; i < this.props.checkoutInfo.length; i++) {
            if(this.props.checkoutInfo[i].checkout_id == this.state.refund.selectedCheckoutId) {
                checkout = this.props.checkoutInfo[i];
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
        console.log(successful_refund);
        return (
            <div>
            <Modal show = {this.state.showModal} onHide = {this.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Refund Checkout</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p><strong>Max Refundable Amount:</strong> ${maxRefundableAmount}</p>
                <form onSubmit={this.refundCheckout}>
                    <FormGroup>
                        <ControlLabel>Refund Amount</ControlLabel>
                        <FormControl 
                            type="number" 
                            id="refundAmount"
                            max={maxRefundableAmount}
                            required
                            />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Refund Reason</ControlLabel>    
                        <FormControl
                            type="text"
                            id="refundReason"
                            required/>
                    </FormGroup>
                    {successful_refund}
                    <Button type="submit" bsStyle="success" value="Submit Refund" disabled={this.props.submitted_refund}>Submit Refund</Button>
                </form>
                </Modal.Body>
            </Modal>
            </div>
            );
    },
    handleAmountChange: function(event) {
        var current = this.state.refund;
        current.refundAmount = event.target.value; 
        this.setState({refund: current})
    },
    handleReasonChange: function(event) {
        var current = this.state.refund;
        current.refundReason = event.target.value; 
        this.setState({refund: current})
    },
    refundCheckout: function(e) {
        e.preventDefault();
        console.log("Performing refund for: ", this.state.refund.selectedCheckoutId);
        var checkout_id = this.state.refund.selectedCheckoutId;
        var refundAmount = $("#refundAmount").val();
        var refundReason = $("#refundReason").val();
        var current = this.state.refund;
        this.setState({refund:current})

        this.props.dispatch(fetchRefundIfNeeded(this.props.email, checkout_id, refundAmount, refundReason));
    },
    formatCheckoutID: function(cell,row) {
         return "<a href='#' id=" + cell + ">" + cell + "</a>";
    },
    formatDate: function(cell, row) {
        return new Date(cell * 1000).toString();
    },
    formatRefund: function(cell, row) {
        // cell is the refund_amount_refunded value.  If this is less than the amount of the original checkout then we want to include a refund button
        // if the value is greater than 0, then someone initiated a refund, so we want to include the reason for the refund and how much it was
        var d = null;
        var refundString = (<p><strong>Refunded</strong>: ${cell}<br></br>{row.refund_refund_reason}</p>);
        var refundButton = (<Button bsStyle="primary" bsSize="small" id={row.checkout_id} onClick={this.openModal}>Refund</Button>)
        if (cell > 0) {
            if (cell == row.amount) {
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
        console.log("Rendering checkouts");
        if (this.props.checkoutInfo == null || $.isEmptyObject(this.props.checkoutInfo) || $.isEmptyObject(this.props.error) == false) {
            return (<div></div>);
        }
        else {
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
                            dataField = "currency"
                            >
                            Currency
                        </TableHeaderColumn>    
                        <TableHeaderColumn 
                            dataField = "create_time"
                            dataFormat={this.formatDate}
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
                            Amount
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
                    {this.buildModal()}
                </div>
            );
        }
    }
});

const mapStateToProps = (state) => {
    return {
        checkoutInfo:state.wepay_checkout.checkout.checkoutInfo,
        email: state.wepay_user.searchedUser,
        error: state.errors.info,
        submitted_refund: state.wepay_checkout.checkout.submitted_refund,
        successful_refund: state.wepay_checkout.checkout.successful_refund,
    }
}

Checkouts = connect(mapStateToProps)(Checkouts);



export default Checkouts
