import 'babel-polyfill'
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import createLogger from 'redux-logger';
import thunkMiddleware from 'redux-thunk'


// application imports
import todoApp from './reducers'
import App from './components/App'

// import logger
const logger = createLogger();



// initialize store
let store = createStore(todoApp,
    applyMiddleware(thunkMiddleware, logger));
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
