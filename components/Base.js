import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

/**
 * Base object that provides useful helper functions for other objects to use.
 * Every object should import Base in order to access these functions
 */
var Base = {
    /**
     * Given a dictionary which contains lists and other dictionaries, this function will flatten the object.
     * It splits nested dictionaries so that they are accessed by key_nestedKey.
     *
     * For example:
     *  {
                "payment_method": {
                    "credit_card":{
                        "id": 3141569
                    }
                }
         }
     * Becomes:
        {
            "payment_method_credit_card_id" : 3141569
        }
     *
     * For lists, the process is similar, except the index of the element is used as the key
     *
     * For example:
     *  {
            "balances":[
                {
                    "currency": "USD"
                }
            ]
        }
     * Becomes:
        {
            "balances_0_currency"
        }
     */
    flatten: function (dictToFlatten) {
        function flatten(dict, parent) {
            var keys = [];
            var values = [];

            for(var key in dict) {
                if(typeof dict[key] === 'object') {
                    var result = flatten(dict[key], parent ? parent + '_' + key : key);
                    keys = keys.concat(result.keys);
                    values = values.concat(result.values);
                }
                else {
                    keys.push(parent ? parent + '_' + key : key);
                    values.push(dict[key]);
                }
            }

            return {
                keys : keys,
                values : values
            }
        }

        var result = flatten(dictToFlatten);
        var flatDict = {};

        for(var i = 0, end = result.keys.length; i < end; i++) {
            flatDict[result.keys[i]] = result.values[i];
        }

        return flatDict;
    },
    /**
     * Given a Unix timestamp (in seconds) convert that to a human readable string.
     *
     * This is used as a formatter for a column in a React-bootstrap-table table.
     *
     * @param cell  - the current cell that we are formatting.  In this case, the cell that contains the UNIX timestamp
     * @param row   - the entire row that the cell belongs to
     */
    formatDate: function(cell, row) {
        return new Date(cell * 1000).toString();
    }
}

export default Base