export const ADD_ERROR = "ADD_ERROR"
export const CLEAR_ERROR = "CLEAR_ERROR"

export const addError = (info, scope="global") =>{
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
