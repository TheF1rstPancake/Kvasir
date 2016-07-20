/**
 * Search Bar object.  This will be used primarily for gathering data from a partner's datastores.
 * This search bar currently only has functionality for searching for users, but it could be extended to search for more.
 *  
 * The idea is that, we will require some level of user input in order to get the initial information in order to make calls to WePay.
 * The data that a user needs to be able to provide will vary depending on how each partner has setup their database.  This object will likely grow beyond a simple text search bar into a full suite of dropdowns, text searches and radio buttons.
 */

import { connect } from 'react-redux'
import React from 'react'
import {FormGroup, FormControl} from "react-bootstrap"
import UserInfo from "../components/User"
import {addUser} from "../actions/user"
import {addAccounts} from "../actions/accounts"
import {addError} from "../actions/errors"
import {searchUser, fetchUserIfNeeded} from "../actions/user"
import {fetchAccountIfNeeded} from "../actions/accounts"

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
    searchUser: function(event) {
        // grab value form input box and update our searchString
        // prevent form default behavior to prevent page reload on submit
        // after this is complete, the form will re-render and only contain results that match or string
        event.preventDefault();
        this.setState({searchString: this.state.value});

        // change the state because now we've searched a user
        this.props.dispatch(searchUser(this.state.value));

        // fetch the user info
        this.props.dispatch(fetchUserIfNeeded(this.state.value));

        // we could also add fetch account info at this point to
        // if the user search was successful then go get the account data
        this.props.dispatch(fetchAccountIfNeeded(this.state.value));
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
                <form onSubmit={this.searchUser}
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
        error: state.errors.global ? state.errors.global.info : {}

    }
}


SearchBar = connect(mapStateToProps)(SearchBar);

export default SearchBar
