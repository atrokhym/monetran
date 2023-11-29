import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { calculateWithdrawalPercentage } from '../../utils';
import { renderStatus } from '../../utils/components';
import Loader from '../common/Loader';
import MainContent from '../common/MainContent';
import * as actions from '../../actions';
import appService from '../../services/appService';
import userService from '../../services/userService';

class WithdrawalsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      withdrawals: [],
      isLoading: false,
      wallets: {},
      amount: 0,
      authorization: '',
      wallet_id: null,
      withdraw_fee: 0,
      withdraw_text: '',
    };
    this.handleInput = this.handleInput.bind(this);
    this.requestWithdrawal = this.requestWithdrawal.bind(this);
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    try {
      const withdrawals = await appService.withdrawals();
      let wallet = await userService.wallets();
      const withdrawFeeConfig = await appService.configs('fees');
      let fee = 0;
      if (withdrawFeeConfig.length > 0) {
        fee = withdrawFeeConfig.filter(
          value => value.label === 'anchor_withdrawal',
        )[0].value;
      }
      this.setState({
        withdrawals,
        wallet,
        withdraw_fee: fee,
        isLoading: false,
      });
    } catch (err) {
      if (err) {
        this.props.dispatch(actions.error(err.message));
      }
    }
  }

  requestWithdrawal(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const { amount, authorization, wallet_id } = this.state;
    if (amount === '' || authorization === '') {
      this.props.dispatch(
        actions.error(
          'Invalid request data sent, check form fields are submitted correctly.',
        ),
      );
    }
    this.props.dispatch(
      actions.requestAnchorWithdrawal({
        amount: parseFloat(amount),
        authorization,
        wallet_id: parseFloat(wallet_id),
      }),
    );
    this.setState({ isLoading: false });
    setTimeout(() => window.location.reload(), 2000);
  }

  //
  // withdraw_fee in reality is exchange-rate
  //

  handleInput(e) {
    const { withdraw_fee } = this.state;
    let { withdraw_text } = this.state;
    e.preventDefault();
    if (e.target.name === 'amount') {
      const amount = parseFloat(e.target.value);
      const fee = calculateWithdrawalPercentage(amount);
      const withdraw_amount = amount - fee;
      const converted_value = withdraw_amount * withdraw_fee;
      if (converted_value < 1) {
        withdraw_text = 'Invalid amount inserted';
      } else {
        withdraw_text = `${amount} MNDA =
        $${converted_value.toLocaleString(undefined, {
          minimumFractionDigits: 4,
        })}

        ${fee} MNDA Total Fees`;
      }
    }
    this.setState({
      [e.target.name]: e.target.value,
      withdraw_text,
      wallet_id: this.state.wallet.id,
    });
  }

  disableInput() {
    const { user } = this.props;
    if (
      !user.bank_info ||
      user.bank_info.bank_name === '' ||
      user.kyc_verified === false
    ) {
      return true;
    }
    return false;
  }

  renderLoading() {
    return <Loader />;
  }

  render() {
    const { user, page } = this.props;
    const { withdrawals, isLoading, wallet, withdraw_text } = this.state;
    return (
      <MainContent user={user} page={page}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Redeem</h4>

            <div className="my-2">
              <div className="grid-2">
                <div>
                  <form className="rad-s b-rad-s p-1 bg-white cardshadow">
                    <h3 className="mt-0">Redeem MNDA</h3>
                    {(() => {
                      if (user.bank_info.bank_name === '') {
                        return (
                          <h5 className="fail-text">
                            Please Update your Bank details{' '}
                            <Link to="/account" className="co-richblack">
                              HERE
                            </Link>{' '}
                            to use Anchor Withdrawal
                          </h5>
                        );
                      }
                    })()}
                    {(() => {
                      if (!user.kyc_verified) {
                        return (
                          <h5 className="fail-text">
                            Please Upload your KYC details{' '}
                            <Link to="/account" className="co-richblack">
                              HERE
                            </Link>{' '}
                            to use Anchor Withdrawal
                          </h5>
                        );
                      }
                    })()}                       
                    <p className="mb-0">
                      You can now redeem MNDA to your local bank account
                    </p>
                    <div className="py-h">
{/*
                      <label htmlFor="withdrawAmount">
                        You can withdraw between 2 and 35,000
                      </label>
*/}
                      <input
                        type="text"
                        name="amount"
                        autoComplete="off"
                        onChange={this.handleInput}
                        value={this.state.amount}
                      />
                      <p>
                        <b>{withdraw_text}</b>
                      </p>
                    </div>
                    <div className="py-h">
                      <label htmlFor="source_wallet">Transaction Wallet</label>
                      <select name="wallet_id" onChange={this.handleInput}>
                        {(() => {
                          return (
                            <option selected value={wallet ? wallet.id : 0}>
                              {wallet ? wallet.currency : 'N/A'} ::{' '}
                              {wallet
                                ? wallet.balance.toLocaleString(undefined, {
                                    minimumFractionDigits: 4,
                                  })
                                : 0.0}
                            </option>
                          );
                        })()}
                      </select>
                    </div>
                    <div className="py-h">
                      <label htmlFor="password">
                        Enter Password for authorization
                      </label>
                      <input
                        type="password"
                        name="authorization"
                        onChange={this.handleInput}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!user.kyc_verified}
                      className="w-100 b-rad-s bg-primary co-white py-1"
                      onClick={this.requestWithdrawal}
                    >
                      Redeem MNDA
                    </button>
                  </form>
                </div>
                <div>
                  <div className="rad-s p-1 bg-white cardshadow">
                    <h3 className="mt-0">Wallet</h3>
                    <div className="rad-s b-rad-s bg-white cardshadow">
                      <h4>{`${wallet ? wallet.code : 'N/A'} - ${
                        wallet
                          ? wallet.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 4,
                            })
                          : 0.0
                      }`}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="mt-0">Redeemed Transactions</h4>
              {(() => {
                if (isLoading) {
                  return this.renderLoading();
                }
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Currency</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          if (withdrawals.length < 1) {
                            return (
                              <tr>
                                <td>No Transaction data at this time.</td>
                              </tr>
                            );
                          }
                        })()}
                        {withdrawals.map((data, i) => (
                          <tr key={i + 1}>
                            <td>{new Date(data.created_at).toDateString()}</td>
                            <td>{data.currency}</td>
                            <td>
                              {data.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 4,
                              })}
                            </td>
                            <td>{renderStatus(data.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}
/* eslint-disable */
WithdrawalsContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};
export default connect(null)(WithdrawalsContainer);
