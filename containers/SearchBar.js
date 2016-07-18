import { connect } from 'react-redux'
import React from 'react'
import {FormGroup, FormControl} from "react-bootstrap"
import UserInfo from "../components/User"
import {addUser} from "../actions/user"
import {addAccounts} from "../actions/accounts"
import {addError} from "../actions/errors"
import {searchUser, fetchUserIfNeeded} from "../actions/wepay_actions"

var SearchBar = React.createClass({

    // sets initial state
    // states in react are just nested associative objects
    getInitialState: function(){
        return { 
            searchString: '',   // the search string we update on submit
            value:"",            // the value of the input text box
            error:{"error_message":""}
        };
    },

    // sets state, triggers render method
    handleChange: function(event){
        // grab value form input box, and change it's value
        // without this, the value of the box won't update
        this.setState({value: event.target.value})
        console.log("scope updated!");
    },
    handleSubmit: function(event) {
        // grab value form input box and update our searchString
        // prevent form default behavior to prevent page reload on submit
        // after this is complete, the form will re-render and only contain results that match or string
        event.preventDefault();
        this.setState({searchString: this.state.value});
        var this2 = this;
        $.post("/user", {"email":this.state.value})
            .fail(function(data){
                console.log("ERROR: ", data);
                
                var error_data = JSON.parse(data.responseText);
                this2.setState({error:error_data});
                this2.props.dispatch(addError(error_data));
            })
            .done(function(data){
                this2.setState(
                    {error:{}}
                );
                this2.props.dispatch(addUser(data));
                this2.props.dispatch(addError({}));

            });

            $.post("/account", {"email":this.state.value})
            .fail(function(data){
                this2.setState({error:JSON.parse(data.responseText)});
                this2.props.dispatch(addAccounts({}));
            })
            .done(function(data){
                this2.setState(
                    {error:{}}
                );
                this2.props.dispatch(addAccounts(data));
                this2.props.dispatch(addError({}));

            });
            //this.props.dispatch(searchUser(this.state.value));
            //this.props.dispatch(fetchUserIfNeeded(this.state.value));
    },
    render: function(dispatch) {
        var searchString = this.state.searchString.trim().toLowerCase();
        //render the user search functionality
        var error_message ="";
        if(this.props.error) {
            error_message = this.props.error.error_message;
        }
        return (
            <div>
                <h4>Search User by Email </h4>
                <form onSubmit={this.handleSubmit}
                >
                <FormGroup controlId="userSearchForm">
                    <FormControl 
                        type="text" 
                        value={this.state.value} 
                        placeholder="Search!" 
                        onChange={this.handleChange} />
                </FormGroup>
                <p>{error_message}</p>
                </form>
            </div>
        )
    }
});

const mapStateToProps = (state) => {
    return {
        error: state.errors.info
    }
}




SearchBar = connect(mapStateToProps)(SearchBar);

export default SearchBar
