import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { sessionService } from 'redux-react-session';
import { configureStore } from './stores/configureStore';
import defaultStore from './stores/defaultStore';
import './index.css';
import App from './App';

const store = configureStore(defaultStore);
sessionService.initSessionService(store, { driver: 'LOCALSTORAGE' });

ReactDOM.render(
  <Provider store={store}>
    <Suspense fallback={() => <div>Loading....</div>}>
      <App />
    </Suspense>
  </Provider>,
  document.getElementById('root'),
);
