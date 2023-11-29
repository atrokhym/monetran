import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import Loader from '../common/Loader';
import MainContent from '../common/MainContent';
import * as actions from '../../actions';
import userService from '../../services/userService';

class TransfersP2pContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recipient_wallet_address: '',
      memo: '',
      amount: '',
      wallet_id: '',
      wallets: {},
      isLoading: false,
      transfers: [],
      showModal: false,
    };
    this.handleInput = this.handleInput.bind(this);
    this.transfer = this.transfer.bind(this);
    this.toggleMemo = this.toggleMemo.bind(this);
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    const wallet = await userService.wallets();
    const transfers = await userService.p2pTransferHistory();
    this.setState({ wallet, transfers, isLoading: false });
  }

  handleClose = () => {
    this.setState({ showModal: false });
  };

  handleShow = () => {
    this.setState({ showModal: true });
  };

  handleInput(e) {
    e.preventDefault();
    this.setState({
      [e.target.name]: e.target.value,
      wallet_id: this.state.wallet.id,
    });
  }

  renderLoading() {
    return <Loader />;
  }

  toggleMemo(e) {
    e.preventDefault();
    document.getElementById('memo_container').style.display = 'block';
    document.getElementById('memo_toggle').style.display = 'none';
  }

  async transfer(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const { recipient_wallet_address, memo, wallet_id, amount } = this.state;
    try {
      this.props.dispatch(
        actions.transferP2pRequest({
          recipient_wallet_address,
          memo,
          wallet_id: parseInt(wallet_id, 10),
          amount: parseFloat(amount),
        }),
      );
      this.setState({ isLoading: false });
      this.handleShow();
    } catch (err) {
      this.setState({ isLoading: false });
      if (err) {
        this.props.dispatch(actions.error(err.message));
        this.handleShow();
      }
    }
  }

  renderFlashMessage() {
    const { error, alert, page } = this.props || this.props.location;
    if (error) {
      return <div className="error-msg">{error}</div>;
    }
    if (alert) {
      if (page === 'overview' || page === 'wallets' || page === 'transfers') {
      }
      return <div className="success-msg">{alert}</div>;
    }
    return null;
  }

  showModalNotification = () => {
    const customStyles = {
      content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
      },
    };
    Modal.setAppElement('#root');
    return (
      <div>
        <Modal
          isOpen={this.state.showModal}
          contentLabel="Minimal Modal"
          style={customStyles}
        >
          {this.renderFlashMessage()}
          <br />
          <button onClick={this.handleClose}>Close</button>
        </Modal>
      </div>
    );
  };

  render() {
    const { user, page, p2ptransferComplete } = this.props;
    const { wallet, transfers, isLoading } = this.state;
    if (isLoading) return this.renderLoading();
    if (p2ptransferComplete) return showP2PCompleteView();
    return (
      <MainContent user={user} page={page}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">New P2P Transfer</h4>
            <div className="rad-s mt-2 bg-white p-1 cardshadow">
              <p>
                <i>Please fill in recipient's details</i>
              </p>
              <form>
                <div className="grid-2-s">
                  <div className="py-h">
                    <label htmlFor="recipient_wallet_address" className="m-0">
                      Recipient federation or wallet Address
                    </label>
                    <input
                      type="text"
                      name="recipient_wallet_address"
                      value={this.state.recipient_wallet_address}
                      onChange={this.handleInput}
                    />
                  </div>
                  <div
                    className="py-h"
                    id="memo_container"
                    style={{ display: 'none' }}
                  >
                    <label htmlFor="recipient_wallet_address" className="m-0">
                      Memo For Transaction
                    </label>
                    <input
                      type="text"
                      name="memo"
                      value={this.state.memo}
                      onChange={this.handleInput}
                    />
                  </div>
                  <div className="py-h m-0">
                    <label htmlFor="amount">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={this.state.amount}
                      onChange={this.handleInput}
                    />
                  </div>
                  <div>
                    <small>For non federation transactions only</small>
                    <br />
                    <button
                      type="button"
                      id="memo_toggle"
                      className="rad-s bg-primary co-white
                      px-1"
                      onClick={this.toggleMemo}
                    >
                      Attach Memo
                    </button>
                  </div>
                </div>
                <div className="py-h m-0 hds">
                  <label htmlFor="wallet_id">Source Wallet</label>
                  <select
                    name="wallet_id"
                    value={this.state.wallet_id}
                    onChange={this.handleInput}
                  >
                    {(() => {
                      return (
                        <option defaultValue={wallet ? wallet.id : 0}>
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
                <div className="py-1" id="proceed_btn">
                  <div className="d-flx j-c-c py-h">
                    <button
                      type="button"
                      className="rad-s bg-primary co-white px-2 py-1"
                      onClick={this.transfer}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="pt-2">
              <h4 className="mt-0">P2P Transfer History</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (transfers.length < 1) {
                        return (
                          <tr>
                            <td>No Transaction data at this time.</td>
                          </tr>
                        );
                      }
                    })()}
                    {transfers.map((data, i) => (
                      <tr key={i + 1}>
                        <td>{data.recipient_wallet_address}</td>
                        <td>
                          {data.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 4,
                          })}
                        </td>
                        <td>{data.currency || 'None'}</td>
                        <td>{new Date(data.created_at).toDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
{/*
          {this.showModalNotification()}
*/}
        </section>
      </MainContent>
    );
  }
}

const showP2PCompleteView = () => (
  <section className="width-100-pc min-height-100-vh">
    <div className="maxwidth-xs mx-auto wrapper h-100 d-flx flex-dir-col j-c-c al-i-c">
      <h1 className="mt-h">Monetran</h1>

      <p className="fw-bold">Transfer Completed</p>
      <div className="bar" />
      <div className="p-2 w-100">
        <div className="py-3 d-flx j-c-c">
          <img
            src="https://res.cloudinary.com/hakase-labs/image/upload/v1560086592/604a0cadf94914c7ee6c6e552e9b4487-curved-check-mark-circle-icon-by-vexels_iyloll.png"
            alt="success"
            style={{ objectFit: 'contain', height: '50%' }}
          />
        </div>
      </div>
      <p className="tx-c">
        P2P Transfer to recipient has been successfully processed!
      </p>
      <button
        type="button"
        className="rad-s bg-primary co-white px-2 py-1"
        onClick={() => {
          window.location.replace('/overview');
        }}
      >
        Back to Dashboard
      </button>
    </div>
  </section>
);

/* eslint-disable */
TransfersP2pContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
  p2ptransferComplete: PropTypes.bool,
};

const mapStateToProps = state => {
  const { error, alert, p2ptransferComplete } = state.user || {};
  return {
    error,
    alert,
    p2ptransferComplete,
  };
};

export default withRouter(connect(mapStateToProps)(TransfersP2pContainer));
