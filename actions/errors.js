export const ADD_ERROR = "ADD_ERROR"
export const CLEAR_ERROR = "CLEAR_ERROR"
export const CLEAR_ALL_STATE = "CLEAR_ALL_STATE"

export const addError = (info, scope="global") =>{
    if (scope == "global") {
        dispatch => (
            dispatch(clearAllStates())
        );
    }
    return {
        type:ADD_ERROR,
        info: info,
        scope: scope
    }
}

export const clearError = (scope="global") => {
    return {
        type: CLEAR_ERROR,
        scope: scope
    }
}

export const clearAllStates = () => {
    return {
        type: CLEAR_ALL_STATE
    }
}
