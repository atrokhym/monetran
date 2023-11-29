import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
//import { GoogleLogin } from 'react-google-login';
//import { GOOGLE_CLIENT_ID } from '../utils/config';

import * as actions from '../actions';
import { Plugins } from '@capacitor/core';
import "@codetrix-studio/capacitor-google-auth";
//import './LoginComponent.css';


class LoginComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

/*
  componentDidMount() {
    gapi.signin2.render('my-signin2', {
      'scope': 'profile email',
      'width': 240,
      'height': 50,
      'longtitle': true,
      'theme': 'dark',
      'onsuccess': this.onSuccess,
      'onfailure': this.onFailure
    });

  }
*/

  async googleSignIn() {
      let googleUser = await Plugins.GoogleAuth.signIn();
      console.info('googleUser', googleUser);
      //alert(JSON.stringify(googleUser))
      if (googleUser) {
        const payload = {
          provider: 'google',
          oauthUID: googleUser.id,
        };
        this.props.dispatch(actions.oAuthLogin(payload.provider, payload.oauthUID)); // eslint-disable-line    
      }
  }


  onFailure(error) {
    alert(JSON.stringify(error));
    console.log(error);
  }
  onSuccess(googleUser) {
    alert(JSON.stringify(googleUser));
    const profile = googleUser.getBasicProfile();
    console.log("Name: " + profile.getName());
    console.log('profile', profile);
  }



  render() {
    const {
      email,
      password,
      handleChange,
      handleLogin,
      handleGoogleSignIn,
      handleGoogleAuthError,
      error,
      alert,
    } = this.props;

    const renderErr = err => {
      if (err) {
        return <div className="fail-text">{err}</div>;
      }
    };

    const renderAlert = () => <div className="success-text">{alert}</div>;

    const responseGoogle = (response) => {
      console.log(response);
      var res = response.profileObj;
      console.log(res);
      debugger;
      //this.signup(response);
    };

    return (
      <div>
        <Link className="skip-link sr" to="/login">
          <h1 className="sr">monetran</h1>
        </Link>
        <main>
          <section className="width-100-pc min-height-100-vh">
            <div className="maxwidth-xs mx-auto wrapper d-flx flex-dir-col al-i-c">
              <h1 className="mt-h">Monetran</h1>
              <p className="my-1">Welcome back</p>
              <p className="fw-bold">LOGIN</p>
              <div className="bar" />
              {renderErr(error)}
              {renderAlert()}
              <form className="p-1 w-100" onSubmit={handleLogin}>
                <div className="py-h">
                  <input
                    type="text"
                    name="email"
                    value={email}
                    placeholder="Email Address"
                    onChange={handleChange}
                  />
                </div>
                <div className="py-h">
                  <input
                    type="password"
                    name="password"
                    value={password}
                    placeholder="Password"
                    onChange={handleChange}
                  />
                </div>
                <div className="d-flx j-c-c py-1">
                  <button
                    type="submit"
                    className="rad-s bg-primary co-white w-100 py-1"
                  >
                    Sign In
                  </button>
                </div>
{/*
                <p className="tx-c m-0">or </p>
*/}
                <div className="d-flx j-c-c py-1">
{/*
                  <a href="#">
                    <button type="button" onClick={() => this.googleSignIn()}
                          style={{background:'#4285f4', color:'white', border:'none', width:'200px', height:'40px', 'border-radius':'3%'}}>
                      <img src="https://www.iconfinder.com/data/icons/social-media-2210/24/Google-512.png" 
                          style={{width:'30px', background:'white', 'border-radius':'50%'}} alt=""/>
                      <b style={{top: '-10px', left: '5px', position: 'relative'}}>Login with Google</b>
                    </button>
                  </a>
*/}
{/*
                  <div id="customBtn" class="customGPlusSignIn">
                    <button onClick={() => this.googleSignIn()} >
                      <span class="icon"></span>
                      <span class="buttonText">Sign-in</span>
                    </button>
                  </div>
*/}
{/*
                  <div id="my-signin2"></div>
                  <GoogleLogin
                    clientId={GOOGLE_CLIENT_ID}
                    buttonText="Login with Google"
                    onSuccess={handleGoogleSignIn}
                    onFailure={handleGoogleAuthError}
                    cookiePolicy="single_host_origin"
                  />
*/}
                </div>
              </form>

              <p className="tx-c">
                <Link to="/password/reset" className="co-primary">
                  Forgot Password
                </Link>
              </p>

              <p className="tx-c">
                Don't have an account?{' '}
                <Link to="/signup" className="co-primary">
                  Sign Up
                </Link>
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }
}

LoginComponent.defaultProps = {
  error: null,
  alert: null,
};

LoginComponent.propTypes = {
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  error: PropTypes.string,
  alert: PropTypes.string,
  handleChange: PropTypes.func.isRequired,
  handleLogin: PropTypes.func.isRequired,
  handleGoogleSignIn: PropTypes.func.isRequired,
  handleGoogleAuthError: PropTypes.func.isRequired,
};
export default LoginComponent;
