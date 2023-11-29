import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { renderStatus } from '../../utils/components';
import Loader from '../common/Loader';
import MainContent from '../common/MainContent';
import * as actions from '../../actions';
import appService from '../../services/appService';

class OverviewContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      xlm_price: 0,
      isLoading: false,
      wallet: {},
      recentWalletTxts: [],
      walletTransactions: {
        num_transfers: 0,
        total_funded_to_wallets: 0,
      },
      withdraw_fee: 0,
    };
    //this.activateWallet = this.activateWallet.bind(this);
  }

  async componentDidMount() {
    this.setState({ isLoading: true }); //eslint-disable-line
    try {
      const overviewData = await appService.overview();
      const { walletTransactions, recentWalletTxts, wallet } = overviewData;
      const xlm_price = await appService.xlmPrice(); //eslint-disable-line
      const withdrawFeeConfig = await appService.configs('fees');
      let withdraw_fee = 0;
      if (withdrawFeeConfig.length > 0) {
        withdraw_fee = withdrawFeeConfig.filter(
          value => value.label === 'anchor_withdrawal',
        )[0].value;
      }
      this.setState({
        xlm_price,
        wallet,
        recentWalletTxts,
        walletTransactions,
        withdraw_fee,
        isLoading: false,
      });
    } catch (err) {
      if (err) {
        return this.props.dispatch(actions.error(err.message));
      }
    }
  }

  /** deprecated: Wallets are automatically activate**/
  activateWallet(e) {
    e.preventDefault();
    this.props.dispatch(actions.activateWallet(e.target.id)); // eslint-disable-line
  }

  renderLoading() {
    return <Loader />;
  }

  /*eslint-disable */
  render() {
    const {
      isLoading,
      walletTransactions,
      wallet,
      recentWalletTxts,
      xlm_price,
      withdraw_fee,
    } = this.state;
    const { user } = this.props;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <p>
              Welcome back,
              {` ${user.firstname}`}
            </p>
            <h4 className="mt-0">Dashboard</h4>

            <div className="grid-2-1 my-2">
              <div className="grid-2 rad-s bg-white p-1 cardshadow">
                <div className="rad-s b-rad-s bg-white cardshadow">
                  <div className="p-1">
                    <p className="mb-0">
                      {wallet.code}
                    </p>
                    <h3 className="m-0">
                      {wallet.balance
                        ? wallet.balance.toLocaleString()
                        : 0.0 || 0}{' '}
                      - value ($
                      {(wallet.balance * withdraw_fee).toLocaleString()})
                    </h3>
                    <br />
                    {(() => {
                      if (wallet.balance > 0) {
                        return (
                          <Link to="/transfers/p2p">
                            <button className="w-100 b-rad-s bg-primary co-white py-1">
                              SEND {wallet.currency.toUpperCase()}
                            </button>
                          </Link>
                        );
                      }
                    })()}
                  </div>
                </div>
                <div className="rad-s bg-white p-1 cardshadow">
                  <p className="mb-0">Number of P2P Transfers Made</p>
                  <h3 className="m-0">{walletTransactions.num_transfers}</h3>
                </div>
              </div>
              <div className="side-grid"></div>
            </div>

            <div className="pt-2">
              <h4 className="mt-0">Recent Wallet Transactions</h4>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Currency</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (recentWalletTxts.length < 1) {
                        return (
                          <tr>
                            <td>No Transaction data at this time.</td>
                          </tr>
                        );
                      }
                    })()}
                    {recentWalletTxts.map((data, i) => (
                      <tr key={i + 1}>
                        <td>{new Date(data.created_at).toDateString()}</td>
                        <td>{data.type}</td>
                        <td>{wallet.code}</td>
                        <td>{data.amount.toLocaleString()}</td>
                        <td>{renderStatus(data.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
OverviewContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};
const mapStateToProps = state => {
  const { isFetching, error, alert, isSignedUp } = state.user || {};
  const { checked, authenticated, user } = state.session || {};
  return {
    isFetching,
    checked,
    authenticated,
    user,
    error,
    alert,
    isSignedUp,
  };
};

export default withRouter(connect(mapStateToProps)(OverviewContainer));
