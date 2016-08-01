export const ADD_ERROR = "ADD_ERROR"
export const CLEAR_ERROR = "CLEAR_ERROR"
export const CLEAR_ALL_STATE = "CLEAR_ALL_STATE"

export const addError = (info, scope="global") =>{
    var error = {
        type:ADD_ERROR,
        info: info,
        scope: scope
    };
    if (scope == "global") {
        return dispatch => (
            dispatch(clearAllStates(error))
        );
    }
    return error;
}

export const clearError = (scope="global") => {
    return {
        type: CLEAR_ERROR,
        scope: scope
    }
}

export const clearAllStates = (error) => {
    return {
        type: CLEAR_ALL_STATE,
        error: error
    }
}
