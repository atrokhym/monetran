import { compose, createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from '../reducers/rootReducer';
import { ENV } from '../utils/config';

/* eslint-disable */
export const configureStore = preloadedState => {
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  return createStore(
    rootReducer,
    preloadedState,
    composeEnhancers(applyMiddleware(thunkMiddleware, logger)),
  );
};

const logger = store => next => action => {
  let result = null;
  const isDev = ENV === 'dev';
  if (isDev) console.group(action.type);
  if (isDev) console.info('dispatching', action);
  result = next(action);
  if (isDev) console.log('next state', store.getState());
  if (isDev) console.groupEnd(action.type);
  return result;
};
