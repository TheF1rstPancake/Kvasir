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
import {addAccounts} from "../actions/accounts"

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
                this2.props.dispatch(addAccounts(data));

            });    
    },
    render: function() {
        // render user info
        var userInfoSection;
        console.log("User: ", this.props);
        if(this.props.userInfo == null || $.isEmptyObject(this.props.error) == false){
            return <div></div>;
        }
        else {
            var resendConf;
            if (this.props.userInfo.state != "registered") {
                if(this.state.resendError.error_message) {
                    resendConf = <Label bsStyle="warning">Error resending confirmation: {this.state.resendError.error_message}</Label>
                }
                else{
                    resendConf = <Button bsStyle="info" onClick={this.resendConf}>Resend Confirmation</Button>
                }
            }

            userInfoSection= <div>
                <Row>
                    <Col lg={12}>
                    <p><strong>Email:</strong><br></br>{this.props.userInfo.email}
                    </p>
                    </Col>
                </Row>  
                <Row>
                    <Col lg={6}>
                        <strong>First Name:</strong><br></br>{this.props.userInfo.first_name}
                    </Col>
                    <Col lg={6}>
                        <strong>Last Name:</strong><br></br>{this.props.userInfo.last_name}
                    </Col>
                </Row>
                <Row>
                    <Col lg={6}>
                        <strong>State:</strong><br></br>{this.props.userInfo.state}
                        <br></br>
                        {resendConf}
                    </Col>
                    <Col lg={6}>
                        <strong>User_ID:</strong><br></br>{this.props.userInfo.user_id}
                    </Col>
                </Row>
                </div>;
                
        }
        return (<div>{userInfoSection}</div>);
    }

});

const mapStateToProps = (state) => {
    return {
        userInfo:state.user.userInfo,
        error: state.errors.info
    }
}

UserInfo = connect(mapStateToProps)(UserInfo);

export default UserInfo
