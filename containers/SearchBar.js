/**
 * Search Bar object.  This will be used primarily for gathering data from a partner's datastores.
 * This search bar currently only has functionality for searching for users, but it could be extended to search for more.
 *  
 * The idea is that, we will require some level of user input in order to get the initial information in order to make calls to WePay.
 * The data that a user needs to be able to provide will vary depending on how each partner has setup their database.  This object will likely grow beyond a simple text search bar into a full suite of dropdowns, text searches and radio buttons.
 */

import { connect } from 'react-redux'
import React from 'react'
import {FormGroup, FormControl, DropdownButton, Col, Row} from "react-bootstrap"
import UserInfo from "../components/User"

import {searchUser, fetchUserIfNeeded, clearUser} from "../actions/user"
import {searchPayer, fetchPayerIfNeeded} from "../actions/payer"
import {fetchAccountIfNeeded, clearAccounts} from "../actions/accounts"

import {clearCheckouts} from "../actions/checkouts"
import {clearWithdrawals} from "../actions/withdrawals"

import {addPayer, clearPayer} from '../actions/payer'

import {addError, clearAllStates} from "../actions/errors"


var SearchBar = React.createClass({
    /**
     * Define the properties for the SearchBar object
     *
     * resource -   the type of resource this search bar queries.  Currently, the options are "user" and "payer"
     */
    propTypes: {
        resource: React.PropTypes.string.isRequired    // what we are searching for.  Depending on what it is, it will do a different searchFunction
    },
    /**
     * Set the initial state of the search bar
     * Initially, it's just an empty search string and value
     */
    getInitialState: function(){
        return { 
            searchString: '',               // the search string we update on submit
            value:"",                       // the value of the input text box
            resource: "user",                   // the value of the drop down box that tells us what we are searching for - merchant or payer
        };
    },
    /**
     * When we search a new resource, clear all existing states
     *
     * Normally `clearAllStates` is used when a global error occurs that should bring everything to a halt.
     * We can leverage it here though with no error information to clear everything
     */
    clearAll: function() {
        this.props.dispatch(clearAllStates({}));
    },
    /**
     * Handle a change to the search bar object (for when someone starts typing in it)
     */ 
    handleChange: function(event){
        // grab value form input box, and change it's value
        // without this, the value of the box won't update
        this.setState({value: event.target.value})
    },
    /**
     * Handle a change in the select field next to the search bar
     */
    handleResourceSelect: function(event) {
        var value = event.target.options[event.target.options.selectedIndex].value
        console.log(value)
        this.setState({resource:value})
    },
    /**
     * Handles the form submit.  
     * After a user submits the form, we check what resource they had selected 
     * and then call the apporpriate function to get the information for that resource
     */
    search: function(event) {
        event.preventDefault();
        if (this.state.resource == "user") {
            console.log("Searching user");
            this.searchUser(event);
        }
        else if(this.state.resource == "payer") {
            console.log("Searching payer");
            this.searchPayer(event);
        }
        else {
            this.props.dispatch(addError({"error_message":"Resource not selected!  Don't know what to search."}));
        }
    },
    /**
     * Search for a merchant based on the provided email address
     * After the merchant is successfully found, we get their account information too
     */
    searchUser: function(event) {
        // grab value form input box and update our searchString
        // prevent form default behavior to prevent page reload on submit
        // after this is complete, the form will re-render and only contain results that match or string
        event.preventDefault();

        var this2 = this;

        // clear all states
        this.clearAll()

        this.setState({searchString: this.state.value});

        // change the state because now we've searched a user
        this.props.dispatch(searchUser(this.state.value));

        // fetch the user info and after the user info is fetched, get the account error
        this.props.dispatch(fetchUserIfNeeded(this.state.value, null,
                function(){
                    this2.props.dispatch(fetchAccountIfNeeded(this2.state.value, null))
                }
        ));
    },
    /**
     * Search for a pyaer based on the provided email address
     */
    searchPayer: function(event) {
        event.preventDefault();

        var this2 = this;
        this.setState({searchString: this.state.value});

        // clear existing object states.  We are starting from scratch
        this.clearAll();

        // change the state because now we've searched a user
        this.props.dispatch(searchPayer(this.state.value));

        // fetch the user info and after the user info is fetched, get the account error
        this.props.dispatch(fetchPayerIfNeeded(this.state.value));
    },
    /**
     * Render the search bar
     */
    render: function(dispatch) {
        var searchString = this.state.searchString.trim().toLowerCase();
        //render the user search functionality
        var error_message ="";
        if(this.props.error) {
            error_message = this.props.error.error_message;
        }

        return (
            <div>
                <h4>Search </h4>
                <form onSubmit={this.search}>
                    <FormGroup controlId="userSearchForm">
                        <Col lg={2} sm={6}>
                            <FormControl componentClass="select" onChange={this.handleResourceSelect}>
                                <option value ="user" key="user">User</option>
                                <option value ="payer" key="payer">Payer</option>
                            </FormControl>
                        </Col>
                        <Col lg={10} sm={6}>
                        <FormControl 
                            type="text" 
                            value={this.state.value} 
                            placeholder="Search!" 
                            onChange={this.handleChange} />
                        </Col>
                    </FormGroup>
                    <p>{error_message}</p>
                </form>
            </div>
        );
    }
});

/**
 * Map the Redux state to props for this objects
 *
 * The search bar does not have it's own error structure.  
 * Instead it reports all errors globally since a failed search should result in a halt of all operations.
 *
 * error:   global errors that may have occurred.  
 *
 */
const mapStateToProps = (state) => {
    return {
        error:      state.errors.global ? state.errors.global.info : {}
    }
}


SearchBar = connect(mapStateToProps)(SearchBar);

export default SearchBar
