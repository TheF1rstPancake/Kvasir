import React, { PropTypes } from 'react'
import {Grid, FormGroup, FormControl, Row, Col, ControlLabel, Table} from "react-bootstrap"
import { connect } from 'react-redux'
import {BootstrapTable} from "react-bootstrap-table"

import Base from "./Base"

var Checkouts = React.createClass({
    getInitialState: function() {
        return {
            checkoutInfo: {},
        }
    },
    handleClick: function() {

    },
    formatCheckoutID: function(cell,row) {
         return "<a href='#' id=" + cell + ">" + cell + "</a>";
    },
    formatDate: function(cell, row) {
        return new Date(cell * 1000).toString();
    },
    serialize: function(info) {
        var array = [];

        for (var i = 0; i < info.length; i++) {
            array.push(Base.flatten(info[i]));
        }
        return array;
    },
    render: function() {
        var this2 = this;
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
                    </BootstrapTable>
                    </Row>
                </div>
            );
        }
    }
});

const mapStateToProps = (state) => {
    return {
        checkoutInfo:state.checkouts.checkoutInfo,
        email: state.wepay_user.searchedUser,
        error: state.errors.info
    }
}

Checkouts = connect(mapStateToProps)(Checkouts);



export default Checkouts
