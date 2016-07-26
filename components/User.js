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
    getInitialState: function(){
        return { 
           userInfo:{},
           error:{},
           resendError: {}
        }
    },
    resendConf: function() {
        var this2 = this;
        $.post("/user/resend_confirmation", {"email":this.props.userInfo.email})
            .fail(function(data) {
                console.log("ERROR: ", data);
                this2.setState({resendError:JSON.parse(data.responseText)});
            })
            .done(function(data){
                this2.setState(
                    {resendError:{}}
                );
            });    
    },
    render: function() {
        // render user info
        var userInfoSection;
        if(this.props.userInfo == null || $.isEmptyObject(this.props.error) == false){
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
            
            return (<div id="user_info">{userInfoSection}</div>);
        }   
    }
});

const mapStateToProps = (state) => {
    return {
        userInfo:state.wepay_user.user.userInfo,
        error: state.errors.global ? state.errors.global.info : {}
    }
}

UserInfo = connect(mapStateToProps)(UserInfo);

export default UserInfo
