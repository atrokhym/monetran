import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
//import { GoogleLogin } from 'react-google-login';
//import { GOOGLE_CLIENT_ID } from '../utils/config';

import * as actions from '../actions';
import { Plugins } from '@capacitor/core';
import "@codetrix-studio/capacitor-google-auth";


class SignupComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async googleSignUp() {
    let googleUser = await Plugins.GoogleAuth.signIn();
    console.info('googleUser', googleUser);
    // prepare payload
    const payload = {
      email: googleUser.email,
      firstname: googleUser.givenName,
      lastname: googleUser.familyName,
      with_oauth: 'yes',
      oauth_provider: 'google',
      oauth_uid: googleUser.id,
    };
    this.props.dispatch(actions.signupUser(payload)); // eslint-disable-line
  }


//const SignupComponent = (props) => {
  render() {
    const {
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
      handleChange,
      handleSignIn,
      handleGoogleSignup,
      handleGoogleAuthError,
      error,
    } = this.props;

    const renderErr = (err) => {
      if (err) {
        return (<div className="fail-text">{err}</div>);
      }
    };


    return (
      <main>
        <section className="width-100-pc min-height-100-vh">
          <div className="maxwidth-xs mx-auto wrapper d-flx flex-dir-col al-i-c">

            <h1 className="mt-h">Monetran</h1>

            <p className="fw-bold pt-1">SIGN UP</p>
            <div className="bar" />
            {renderErr(error)}
            <form className="p-1 w-100" onSubmit={handleSignIn} action="post">
              <div className="grid-2-s">
                <div className="py-h">
                  <input type="text" name="firstname" value={firstname} placeholder="First Name" onChange={handleChange} />
                </div>
                <div className="py-h">
                  <input type="text" name="lastname" value={lastname} placeholder="Last Name" onChange={handleChange} />
                </div>
              </div>
              <div className="py-h">
                <input type="email" name="email" value={email} placeholder="Email Address" onChange={handleChange} />
              </div>
              <div className="py-h">
                <input type="password" name="password" value={password} placeholder="Password" onChange={handleChange} />
              </div>
              <div className="py-h">
                <input type="password" name="confirmPassword" value={confirmPassword} placeholder="Confirm Password" onChange={handleChange} />
              </div>
              <div className="d-flx j-c-c py-1">
                <button type="submit" className="rad-s bg-primary co-white w-100 py-1">
                  Sign Up
                </button>
              </div>
{/*
              <p className="tx-c m-0">or</p>
*/}
              <div className="d-flx j-c-c py-1">
{/*
                <a href="#">
                  <button type="button" onClick={() => this.googleSignUp()}
                        style={{background:'#4285f4', color:'white', border:'none', width:'200px', height:'40px', 'border-radius':'3%'}}>
                    <img src="https://www.iconfinder.com/data/icons/social-media-2210/24/Google-512.png" 
                        style={{width:'30px', background:'white', 'border-radius':'50%'}} alt=""/>
                    <b style={{top: '-10px', left: '5px', position: 'relative'}}>Register with Google</b>
                  </button>
                </a>
*/}
  {/*
                <GoogleLogin
                  clientId={GOOGLE_CLIENT_ID}
                  buttonText="Register with Google"
                  onSuccess={handleGoogleSignup}
                  onFailure={handleGoogleAuthError}
                  cookiePolicy="single_host_origin"
                />
  */}
              </div>
            </form>

            <p className="tx-c">
              Already have an account?
              {' '}
              <Link to="/login" className="co-primary">Sign In</Link>
            </p>

            <p className="tx-c">
              By continuing with this sign up process, you agree to Monetran's
              {' '}
              <Link to="/" className="co-primary">Terms of Use</Link>
              {' '}
              and
              {' '}
              <Link to="/" className="co-primary">Privacy Policy</Link>
            </p>
          </div>
        </section>
      </main>
    );
  }
};

SignupComponent.defaultProps = {
  error: null,
};
SignupComponent.propTypes = {
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSignIn: PropTypes.func.isRequired,
  handleGoogleSignup: PropTypes.func.isRequired,
  handleGoogleAuthError: PropTypes.func.isRequired,
  error: PropTypes.string,
};
export default SignupComponent;
