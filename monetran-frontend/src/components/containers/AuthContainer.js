import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as _ from 'lodash';
import * as qs from 'query-string';

import Loader from '../common/Loader';
import LoginComponent from '../LoginComponent';
import OTP from '../OTP';
import ResetPassword from '../ResetPassword';
import SignupComponent from '../SignupComponent';
import OverviewContainer from './OverviewContainer';
import * as actions from '../../actions';

import { Plugins } from '@capacitor/core';
import "@codetrix-studio/capacitor-google-auth";


class AuthContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      user: {},
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleSignIn = this.handleSignIn.bind(this);
    this.handleGoogleSignIn = this.handleGoogleSignIn.bind(this);
    this.handleGoogleSignup = this.handleGoogleSignup.bind(this);
    this.handleGoogleAuthError = this.handleGoogleAuthError.bind(this);
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleLogin(e) {
    e.preventDefault();
    const { dispatch } = this.props;
    const { email, password } = this.state;
    dispatch(actions.loginUser(email, password));
  }

  handleSignIn(e) {
    e.preventDefault();
    const { dispatch } = this.props; // eslint-disable-line
    const {
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
    } = this.state;
    if (password !== confirmPassword) {
      dispatch(actions.passwordConfirmFailed()); // eslint-disable-line
    }
    dispatch(
      actions.signupUser({
        firstname,
        lastname,
        email,
        password,
        confirmPassword,
      }),
    );
  }

  handleGoogleSignIn(resp) {
    // prepare payload
    const payload = {
      provider: 'google',
      oauthUID: resp.googleId,
    };
    this.props.dispatch(actions.oAuthLogin(payload.provider, payload.oauthUID)); // eslint-disable-line    
  }

  handleGoogleSignup(resp) {
    const { profileObj } = resp;
    // prepare payload
    const payload = {
      email: profileObj.email,
      firstname: profileObj.givenName,
      lastname: profileObj.familyName,
      with_oauth: 'yes',
      oauth_provider: 'google',
      oauth_uid: resp.googleId,
    };
    this.props.dispatch(actions.signupUser(payload)); // eslint-disable-line
  }

  handleGoogleAuthError(resp) {
    const { dispatch } = this.props; // eslint-disable-line
    dispatch(
      actions.error('An error occurred while authenticating your account!'),
    );
  }

  renderLoading() {
    return <Loader />;
  }

  render() {
    const {
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
    } = this.state;
    const {
      dispatch,
      isLogin,
      isSignup,
      isLogout,
      isFetching,
      error,
      isSignedUp,
      emailVerify,
      emailVerified,
      emailVerifiedSuccessful,
      use2fa,
      resetPassword,
      changePassword, // display the change password form
      alert,
      checked,
      authenticated,
      user,
    } = this.props || this.props.location; // eslint-disable-line
    const props = {
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
      error,
      alert,
      handleChange: this.handleChange,
      handleLogin: this.handleLogin,
      handleSignIn: this.handleSignIn,
      handleGoogleAuthError: this.handleGoogleAuthError,
      handleGoogleSignIn: this.handleGoogleSignIn,
      handleGoogleSignup: this.handleGoogleSignup,
      dispatch: this.props.dispatch,
    };
    if (use2fa) return <OTP {...props} />;
    if (resetPassword) return <ResetPassword {...props} {...this.props} />;
    if (changePassword) {
      props.withPasswordEntries = true;
      return <ResetPassword {...props} {...this.props} />;
    }
    if (emailVerify) return showEmailNotification(); // eslint-disable-line
    if (isFetching) return this.renderLoading();
    if (checked && authenticated && !_.isEmpty(user)) {
      console.log('checked: ' + checked);
      if (user.is_admin) return <Redirect to="/admin/overview" {...props} />;
      //return <Redirect to="/overview" noThrow {...props} {...this.props} />;
      //return <Redirect push to="/overview" />;
      return <OverviewContainer {...props} {...this.props} />;
      //return this.props.history.push("/overview");
    }
    if (checked && isSignedUp) return <Redirect to="/verify" {...props} />;
    if (isLogin || emailVerifiedSuccessful)
      return <LoginComponent {...props} />;
    if (isSignup) return <SignupComponent {...props} />;
    if (emailVerified) {
      const query = qs.parse(this.props.location.search); // eslint-disable-line
      dispatch(actions.verifyEmail(query));
    }
    if (isLogout) actions.logoutUser();
    return this.renderLoading();
  }
}

AuthContainer.defaultProps = {
  isLogin: false,
  isSignup: false,
  isLogout: false,
  isFetching: false,
  isSignedUp: false,
  emailVerify: false,
  emailVerified: false,
};
AuthContainer.propTypes = {
  isLogin: PropTypes.bool,
  isSignup: PropTypes.bool,
  isLogout: PropTypes.bool,
  isFetching: PropTypes.bool,
  isSignedUp: PropTypes.bool,
  emailVerify: PropTypes.bool,
  emailVerified: PropTypes.bool,
};

const mapStateToProps = state => {
  const {
    isFetching,
    error,
    alert,
    isSignedUp,
    emailVerifiedSuccessful,
    use2fa,
  } = state.user || {};
  const { checked, authenticated, user } = state.session || {};
  return {
    isFetching,
    checked,
    authenticated,
    user,
    error,
    alert,
    isSignedUp,
    emailVerifiedSuccessful,
    use2fa,
  };
};

const showEmailNotification = () => (
  <section className="width-100-pc min-height-100-vh">
    <div className="maxwidth-xs mx-auto wrapper h-100 d-flx flex-dir-col j-c-c al-i-c">
      <h1 className="mt-h">Monetran</h1>

      <p className="fw-bold">LOGIN</p>
      <div className="bar" />
      <div className="p-2 w-100">
        <div className="py-3 d-flx j-c-c">
          <img
            src="https://res.cloudinary.com/hakase-labs/image/upload/v1560086592/604a0cadf94914c7ee6c6e552e9b4487-curved-check-mark-circle-icon-by-vexels_iyloll.png"
            alt="email"
          />
        </div>
      </div>
      <p className="tx-c">
        Just one more thing. An email has been sent to you with a confirmation
        link to activate your account.
      </p>
    </div>
  </section>
);
export default withRouter(connect(mapStateToProps)(AuthContainer));
