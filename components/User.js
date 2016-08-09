/**
 * Class that defines how to display and interact with a merchant User.
 * From here, the end-user will have the ability to:
 *  - resend confirmation
 *  - initiate MFA challenge
 *  - view user account info
 *
 * This object is typically loaded at the same time as the *Account* object, because once we have all of the info to request user data, we can request merchant account data.
 */

import React, { PropTypes } from 'react'
import {FormGroup, FormControl, Row, Col, ControlLabel, Table, Button, Label} from "react-bootstrap"
import { connect } from 'react-redux'
import {addAccounts, fetchAccountIfNeeded} from "../actions/accounts"
import {BootstrapTable} from "react-bootstrap-table"

var UserInfo = React.createClass({
    /**
     * Get the initial state of the user
     * 
     * The initial state of the user object only contains a blank resendError dictionary,
     * This dictionary holds any errors that are the result of resending the confirmation email to a user
     * We store it in this state because there is no action to dispatch for it because we relly don't need one.
     */
    getInitialState: function(){
        return { 
           resendError: {}
        }
    },
    /**
     * Resend confirmation email to a user.
     *
     * There is no action for this because it does not impact any other state nor is it really something that should impact this object's state unless there's an error.
     */
    resendConf: function() {
        var this2 = this;
        $.post("/user/resend_confirmation", {"email":this.props.userInfo.email})
            .fail(function(data) {
                console.log("ERROR: ", data);
                this2.setState({resendError:data});
            })
            .done(function(data){
                this2.setState(
                    {resendError:{}}
                );
            });    
    },
    /**
     * Render the table displaying user info.
     *
     * The table contains really basic information about each user gathered from the WePay /user endpoint
     */
    render: function() {
        var userInfoSection;
        if (this.props.isFetching) {
            return (<div><object data="/static/css/default_spinner.svg" type="image/svg+xml" width="150px"></object></div>);
        }
        else if(this.props.userInfo === undefined || $.isEmptyObject(this.props.error) == false){
            return <div></div>;
        }
        else {
            var resendConf;
            if (this.props.userInfo.state != "registered") {
                if(this.state.resendError.error_message) {
                    resendConf = (<Label bsStyle="warning">Error resending confirmation: {this.state.resendError.error_message}</Label>);
                }
                else{
                    resendConf = (<Button bsStyle="info" onClick={this.resendConf}>Resend Confirmation</Button>);
                }
            }

            userInfoSection= (
                <BootstrapTable
                data={[this.props.userInfo]}
                striped={true}
                hover={true}
                >
                <TableHeaderColumn
                    dataField="email"
                    isKey = {true}
                    >
                    Email
                </TableHeaderColumn>
                <TableHeaderColumn
                    dataField= "first_name"
                    >
                    First Name
                </TableHeaderColumn>
                <TableHeaderColumn
                    dataField= "last_name"
                     >
                    Last Name
                </TableHeaderColumn>
                <TableHeaderColumn
                    dataField= "state"
                    >
                    State
                    {resendConf}
                </TableHeaderColumn>
                <TableHeaderColumn
                    dataField= "user_id"
                    >
                    User Id
                </TableHeaderColumn>
            </BootstrapTable>
            );
            
            return (<div id="user_table"><h4>Merchant Info</h4>{userInfoSection}<hr></hr></div>);
        }   
    }
});

/**
 * Map Redux State to this object's properties
 *
 * userInfo:    the object that holds information about this user
 * isFetching:  true if we are currently fetching information about this user
 * error:       error object with that contains error messages generated from /actions/user and /reducers/user
 */
const mapStateToProps = (state) => {
    return {
        userInfo:   state.wepay_user.user.userInfo,
        isFetching: state.wepay_user.user.isFetching,
        error:      state.errors.user ? state.errors.user.info : {}
    }
}

UserInfo = connect(mapStateToProps)(UserInfo);

export default UserInfo
