import { Link } from 'react-router-dom';
import React, { Component } from 'react';

import * as actions from '../actions';
import userService from '../services/userService';

class ResetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showNextStep: false,
      email: '',
      password: '',
      password_confirmation: '',
      resetToken: '',
    };
  }

  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    if (params !== undefined) this.setState({ resetToken: params.resetToken });
  }

  resetPassword = async e => {
    e.preventDefault();
    try {
      const { email } = this.state;
      await userService.resetPassword(email.trim());
      this.setState({ showNextStep: true });
    } catch (err) {
      if (err) this.props.dispatch(actions.error(err.message));
    }
  };

  renderErr = err => {
    if (err) {
      return <div className="fail-text">{err}</div>;
    }
  };

  renderAlert = alert => <div className="success-text">{alert}</div>;

  handleChange = e => {
    e.preventDefault();
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  changePassword = e => {
    e.preventDefault();
    const { password, password_confirmation, resetToken } = this.state;
    if (password !== password_confirmation) {
      this.props.dispatch(actions.passwordConfirmFailed());
    }
    this.props.dispatch(
      actions.changePassword(
        password,
        password_confirmation,
        resetToken,
        null,
        null,
      ),
    );
    this.setState({ password: '', password_confirmation: '' });
  };

  render() {
    const { showNextStep } = this.state;
    const { alert, error, withPasswordEntries } = this.props;
    if (showNextStep) {
      return (
        <section className="width-100-pc min-height-100-vh">
          <div className="maxwidth-xs mx-auto wrapper h-100 d-flx flex-dir-col j-c-c al-i-c">
            <h1 className="mt-h">Monetran</h1>
            <p className="fw-bold">Reset Password</p>
            <div className="bar" />
            <p className="p-2 w-100">
              Check your inbox for the next steps. If you don't receive an
              email, and it's not in your spam folder this could mean you signed
              up with a different address.
            </p>
            <button className="w-100 b-rad-s bg-primary co-white py-1">
              <Link to="/">Go back</Link>
            </button>
          </div>
        </section>
      );
    }
    if (withPasswordEntries) {
      return (
        <section className="width-100-pc min-height-100-vh">
          <div className="maxwidth-xs mx-auto wrapper h-100 d-flx flex-dir-col j-c-c al-i-c">
            <h1 className="mt-h">Monetran</h1>
            <p className="fw-bold">Reset Password</p>
            <div className="bar" />
            {this.renderErr(error)}
            {this.renderAlert(alert)}
            <div className="p-2 w-100">
              <p className="tx-c">Enter new password</p>
              <form>
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  name="password"
                  onChange={this.handleChange}
                />
                <label htmlFor="password">Confirm Password</label>
                <input
                  type="password"
                  name="password_confirmation"
                  onChange={this.handleChange}
                />
                <br />
                <br />
                <button
                  className="w-100 b-rad-s bg-primary co-white py-1"
                  onClick={this.changePassword}
                >
                  Reset Password
                </button>
              </form>
              <p className="tx-c">
                Have an account?{' '}
                <Link to="/login" className="co-primary">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className="width-100-pc min-height-100-vh">
        <div className="maxwidth-xs mx-auto wrapper h-100 d-flx flex-dir-col j-c-c al-i-c">
          <h1 className="mt-h">Monetran</h1>
          <p className="fw-bold">Reset Password</p>
          <div className="bar" />
          {this.renderErr(error)}
          <div className="p-2 w-100">
            <p className="tx-c">
              Enter your email address below and we'll send you a link to reset
              your password.
            </p>
            <form>
              <input
                type="text"
                name="email"
                onChange={this.handleChange}
                placeholder="Email address"
              />
              <br />
              <br />
              <button
                className="w-100 b-rad-s bg-primary co-white py-1"
                onClick={this.resetPassword}
              >
                Next
              </button>
            </form>
            <p className="tx-c">
              Don't have an account?{' '}
              <Link to="/signup" className="co-primary">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }
}

export default ResetPassword;
