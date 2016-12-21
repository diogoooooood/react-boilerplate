import * as ActionTypes from '../actions/actionTypes';
import merge from 'lodash/merge';
import { routerReducer as routing } from 'react-router-redux';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
    routing
});

export default rootReducer;
