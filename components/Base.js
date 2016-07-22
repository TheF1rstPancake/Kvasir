import React, { PropTypes } from 'react'
import { connect } from 'react-redux'


var Base = {
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
    formatDate: function(cell, row) {
        return new Date(cell * 1000).toString();
    }
}

export default Base