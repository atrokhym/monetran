import { combineReducers } from 'redux';
import { sessionReducer } from 'redux-react-session';
import userReducer from './index';

const rootReducer = combineReducers({
  user: userReducer,
  session: sessionReducer,
});

export default rootReducer;
