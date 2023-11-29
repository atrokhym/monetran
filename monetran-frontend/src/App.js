import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import { PropsRoute } from './routes';
import DashboardContainer from './components/containers/DashboardContainer';
import useAuthenticatedUser from './utils/Auth';
import './App.css';
import AuthContainer from './components/containers/AuthContainer';
import Logout from './components/Logout';

const App = () => (
  <Router history="">
    <Switch>
      <PropsRoute
        component={AuthContainer}
        page="login"
        path="/login"
        isLogin
      />
      <PropsRoute
        component={AuthContainer}
        page="signup"
        path="/signup"
        isSignup
      />
      <PropsRoute
        component={AuthContainer}
        page="verifyemail"
        path="/verify"
        emailVerify
        exact
      />
      <PropsRoute
        component={AuthContainer}
        page="emailVerified"
        path="/account/verify"
        emailVerified
        exact
      />
      <PropsRoute
        component={AuthContainer}
        path="/2fa"
        page="2fa"
        use2fa
        exact
      />
      <PropsRoute
        component={AuthContainer}
        path="/password/reset"
        page="resetpassword"
        resetPassword
        exact
      />
      <PropsRoute
        component={AuthContainer}
        path="/account/password/reset/:resetToken"
        page="changepassword"
        changePassword
        exact
      />
      <PropsRoute component={Logout} path="/logout" exact />
      <Route path="/" component={useAuthenticatedUser(DashboardContainer)} />
    </Switch>
  </Router>
);
export default App;
