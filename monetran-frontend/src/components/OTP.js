import React from 'react';
import * as actions from '../actions';
import userService from '../services/userService';

const OTP = props => {
  const { error, alert, email } = props;
  const verifyCode = async e => {
    e.preventDefault();
    try {
      const code = document.getElementById('verification_code').value;
      const user = await userService.verifyOTP(email, code.trim());
      props.dispatch(actions.saveSessionFromOTP(user));
    } catch (err) {
      if (err) props.dispatch(actions.error(err.message));
    }
  };
  const renderErr = err => {
    if (err) {
      return <div className="fail-text">{err}</div>;
    }
  };

  const renderAlert = () => <div className="success-text">{alert}</div>;
  return (
    <section className="width-100-pc min-height-100-vh">
      <div className="maxwidth-xs mx-auto wrapper h-100 d-flx flex-dir-col j-c-c al-i-c">
        <h1 className="mt-h">Monetran</h1>
        <p className="fw-bold">2-Factor Authentication</p>
        <div className="bar" />
        {renderErr(error)}
        {renderAlert()}
        <div className="p-2 w-100">
          <p className="tx-c">
            Just one more thing. An email has been sent to you with an authentication code to complete your login.
          </p>
          <form>
            <input
              type="text"
              name="code"
              id="verification_code"
              placeholder="Enter verification code"
            />
            <br />
            <br />
            <button
              className="w-100 b-rad-s bg-primary co-white py-1"
              onClick={verifyCode}
            >
              Login Confirmation
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default OTP;
