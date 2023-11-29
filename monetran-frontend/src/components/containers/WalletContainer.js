import { Elements, StripeProvider } from 'react-stripe-elements';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { STRIPE_PUBLIC_KEY } from '../../utils/config';
import { renderStatus } from '../../utils/components';
import CheckoutForm from '../common/CheckoutForm';
import Loader from '../common/Loader';
import MainContent from '../common/MainContent';
import * as actions from '../../actions';
import appService from '../../services/appService';
import userService from '../../services/userService';
import Pagination from '../common/Pagination';

class WalletContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      wallet: {},
      xlm_price: 0,
      isLoading: false,
      transactions: [],
      showForm: false,
      mndaAmount: 0,
      withdraw_fee: 0,
      //pagination
      totalResults: 0,
      currentPage: 1,
      perPage: 10,
    };
    this.activateWallet = this.activateWallet.bind(this);
    this.handleMNDAmountChange = this.handleMNDAmountChange.bind(this);
    this.showBuyForm = this.showBuyForm.bind(this);
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    try {
      const wallet = await userService.wallets();
      const transactionsData = await appService.walletTransactions();
      const transactions = transactionsData.data;
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
        transactions,
        withdraw_fee,
        isLoading: false,
        totalResults: transactionsData.meta.total_results,
        perPage: transactionsData.meta.per_page,
      });
    } catch (err) {
      if (err) {
        // TODO: handle errors
        console.error('err', err.message);
      }
    }
  }

  nextPage = async page => {
    const transactionsData = await appService.walletTransactions(page);
    const transactions = transactionsData.data;
    this.setState({ transactions, currentPage: page });
  };
  activateWallet(e) {
    e.preventDefault();
    this.props.dispatch(actions.activateWallet(e.target.id)); // eslint-disable-line
  }

  handleMNDAmountChange(e) {
    this.setState({ mndaAmount: e.target.value });
  }

  showBuyForm(e) {
    e.preventDefault();
    this.setState({ showForm: true });
  }

  renderLoading() {
    return <Loader />;
  }

  render() {
    const {
      wallet,
      transactions,
      xlm_price,
      isLoading,
      showForm,
      mndaAmount,
      withdraw_fee,
      totalResults,
      currentPage,
      perPage,
    } = this.state;
    if (isLoading) return this.renderLoading();
    if (showForm) return <BuyForm amount={mndaAmount} />;
    const numPages = Math.floor(totalResults / perPage);
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Wallet</h4>
            <br />
           
           
            <div className="my-2">
              <div className="grid-2">
                <div>
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
                    </div>
                    {(() => {
                      if (!wallet.activated) {
                        return (
                          <button
                            id={wallet.id}
                            type="button"
                            className="w-100 b-rad-s bg-primary co-white py-1"
                            onClick={this.activateWallet}
                          >
                            Activate Wallet
                          </button>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="mt-0">Wallet Activities</h4>
              <Table transactions={transactions} wallet={wallet} />
              {totalResults > perPage ? (
                <Pagination
                  pages={numPages}
                  currentPage={currentPage}
                  nextPage={this.nextPage.bind(this)}
                />
              ) : (
                ''
              )}
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}

const Table = ({ transactions, wallet }) => (
  <React.Fragment>
    <div style={{ overflow: 'auto' }}>
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
            if (transactions.length < 1) {
              return (
                <tr>
                  <td>No Transaction data at this time.</td>
                </tr>
              );
            }
          })()}
          {transactions.map((data, i) => (
            <tr key={i + 1}>
              <td>{new Date(data.created_at).toDateString()}</td>
              <td>{data.type}</td>
              <td>{wallet ? wallet.code : 'N/A'}</td>
              <td>{data.amount.toLocaleString()}</td>
              <td>{renderStatus(data.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </React.Fragment>
);

const BuyForm = ({ amount }) => (
  <StripeProvider apiKey={STRIPE_PUBLIC_KEY}>
    <div className="example">
      <center>
        <h1>Purchase Monetran Token</h1>
      </center>
      <Elements>
        <CheckoutForm amount={amount} />
      </Elements>
    </div>
  </StripeProvider>
);

/* eslint-disable */
WalletContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};

Table.propTypes = {
  loadTransactions: PropTypes.func,
  hasMore: PropTypes.bool,
  renderLoading: PropTypes.object,
  transactions: PropTypes.array,
  wallet: PropTypes.object,
};

BuyForm.propTypes = {
  amount: PropTypes.string,
};

const mapStateToProps = state => {
  const { isFetching, error, alert } = state.user || {};
  const { user } = state.session || {};
  return {
    isFetching,
    user,
    error,
    alert,
  };
};

export default connect(mapStateToProps)(WalletContainer);
