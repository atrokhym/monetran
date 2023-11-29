import React, { Component } from 'react';
import {
  CardNumberElement,
  CardCVCElement,
  CardExpiryElement,
  injectStripe,
} from 'react-stripe-elements';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import appService from '../../services/appService';
import * as actions from '../../actions';

class CheckoutForm extends Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.state = { complete: false };
  }

  async submit(e) {
    try {
    const { amount } = this.props;
    const { token } = await this.props.stripe.createToken({ name: 'MNDA-Purchase-Client' });
    const resp = await appService.chargeMNDA({ token: token.id, amount });
    if (resp === 'ok') this.setState({ complete: true });
    } catch (err) {
      this.props.dispatch(actions.error(err.message));
    }
  }

  render() {
    const { complete } = this.state;
    const { amount } = this.props;
    if (complete) return (
      <div>
        <h1>Purchase successfully</h1>
        <Link to="/wallets"><button type="button" className="w-100 b-rad-s bg-primary co-white py-1">See Wallet Balance</button></Link>
      </div>
    );

    return (
      <div className="checkout">
        <p>Purchase ${ amount } value for MNDA?</p>
        <CardNumberElement />
        <CardCVCElement />
        <CardExpiryElement />
        <button
          type="button"
          className="stripe-pay"
          onClick={this.submit}
        >
          Pay
        </button>
      </div>
    );
  }
}

export default connect(null)(injectStripe(CheckoutForm));
