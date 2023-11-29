import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Modal from 'react-modal';
import { renderStatus } from '../../utils/components';
import { viewGCSObject } from '../../utils';
import Loader from '../common/Loader';
import MainContent from '../common/MainContent';
import Pagination from '../common/Pagination';
import * as actions from '../../actions';
import appService from '../../services/appService';
import userService from '../../services/userService';

class TopupContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      wallet: {},
      walletSlug: '',
      amount: 0,
      achReference: '',
      achProof: '',
      achTransfers: [],
      isLoading: false,
      showSummary: false,
      withSummary: true,
      bankData: {},
      showModal: false,
      // pagination
      totalResults: 0,
      currentPage: 1,
      perPage: 15,
    };
    this.generateACHRef = this.generateACHRef.bind(this);
    this.uploadACH = this.uploadACH.bind(this);
    this.sendACHTransferRequest = this.sendACHTransferRequest.bind(this);
  }

  async componentDidMount() {
    const { bankData } = this.state;
    this.setState({ isLoading: true });
    let wallet = await userService.wallets();
    const configs = await appService.configs('bank');
    const achTransfersData = await userService.achTransfers();
    const achTransfers = achTransfersData.data;
    configs.forEach(config => {
      bankData[config.label] = config.value;
    });
    this.setState({
      wallet,
      achTransfers,
      perPage: achTransfersData.meta.per_page,
      totalResults: achTransfersData.meta.total_results,
      isLoading: false,
    });
  }

  nextPage = async page => {
    const achTransfersData = await userService.achTransfers(page);
    const achTransfers = achTransfersData.data;
    this.setState({ achTransfers, currentPage: page });
  };

  // eslint-disable-next-line consistent-return
  async generateACHRef(e) {
    const { dispatch } = this.props;
    e.preventDefault();
    this.setState({ isLoading: true });
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 240);
    const { amount } = this.state; /* eslint-disable-line */
    // eslint-disable-next-line eqeqeq
    // if (walletSlug == '') return dispatch(actions.error('Select a valid wallet to make transaction from'));
    try {
      const achReference = await appService.generateACHRef('MNDA', amount);
      this.setState({ achReference, isLoading: false, showSummary: true });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        dispatch(actions.error(err.message));
        this.handleShow();
      }
    }
  }

  async uploadACH() {
    this.setState({ isLoading: true });
    const doc = document.getElementById('file_ach_proof').files;
    if (doc && doc.length > 0) {
      const uploadObj = new FormData();
      uploadObj.append('image', doc[0]);
      const achProof = await userService.uploadImage(uploadObj);
      this.setState({ achProof, isLoading: false });
      return achProof;
    }
  }

  async sendACHTransferRequest(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const { achReference, amount } = this.state;
    // upload ACH proof
/*    
    const doc = document.getElementById('file_ach_proof').files;
    if (!doc || doc.length < 1) {
      this.setState({ isLoading: false });
      this.props.dispatch(actions.error('Please upload a Payment proof.'));
      return this.handleShow();
    }
*/
    try {
      //const achProof = await this.uploadACH();
      this.props.dispatch(
        //actions.sendACHTransferRequest({ achReference, achProof }),
        actions.sendACHTransferRequest({ achReference, amount })
      );
      this.setState({ isLoading: false, showSummary: false });
      this.handleShow();
      this.nextPage(1);
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        return this.props.dispatch(actions.error(err.message));
      }
    }
  }

  handleClose = () => {
    this.setState({ showModal: false });
  };

  handleShow = () => {
    this.setState({ showModal: true });
  };

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
  renderFlashMessage() {
    const { error, alert, dispatch, page } = this.props || this.props.location;
    if (error) {
      setTimeout(() => dispatch(actions.clearFlashMessages()), 13000);
      // setTimeout(() => window.location.reload(), 1000);
      return <div className="error-msg">{error}</div>;
    }
    if (alert) {
      setTimeout(() => dispatch(actions.clearFlashMessages()), 13000);
      if (page === 'overview' || page === 'wallets' || page === 'transfers') {
        setTimeout(() => window.location.reload(), 1000);
      }
      return <div className="success-msg">{alert}</div>;
    }
    return null;
  }

  render() {
    const {
      isLoading,
      wallet,
      showSummary,
      bankData,
      amount,
      walletSlug,
      achReference,
      achTransfers,
      totalResults,
      currentPage,
      perPage,
    } = this.state;
    if (isLoading) return <Loader />;
    const { user, page } = this.props;
    const numPages = Math.floor(totalResults / perPage);
    return (
      <MainContent user={user} page={page}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <div className="pb-2 non-printable">
              <h4 className="mt-0">Add Funds</h4>
              <h5>
                Send MNDA to <b>{user.account_id} with memo text : {user.memo}</b>
              </h5>
              <div className="my-2">
                <div className="grid-2">
                  <div>
                    <div className="rad-s b-rad-s bg-white cardshadow">
                      <div className="p-1">
                        <h3 className="mt-0">Pay with MNDA</h3>
                        <p className="mb-0">
                          {`Send MNDA to ${user.federation_address}  `}
                        </p>
                        <p>
                          Wallet will be funded when your payment is received.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3>ACH Transfer Operations</h3>
            {this.renderFlashMessage()}
            {!showSummary ? (
              <div className="" id="ach_generate">
                <div className="rad-s bg-white p-1 cardshadow">
                  <p className="mt-0 fw-bold">
                    (1) Generate Transaction Reference
                  </p>
                  <small>
                    Use this generated reference as Memo in your ACH transfer.
                  </small>
                  <form>
                    {(() => {
                      if (user.bank_info.bank_name === '') {
                        return (
                          <h5 className="fail-text">
                            Please Update your Bank details{' '}
                            <Link to="/account" className="co-richblack">
                              HERE
                            </Link>{' '}
                            to use ACH Transfer
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
                            to use ACH Transfer
                          </h5>
                        );
                      }
                    })()}   
                    <div className="py-h">
                      <label htmlFor="amount">Amount in USD</label>
                      <input
                        type="text"
                        name="amount"
                        placeholder="Enter amount to fund"
                        value={amount}
                        onChange={e => {
                          this.setState({ [e.target.name]: e.target.value });
                        }}
                      />
                    </div>
                    <div className="py-h m-0 hds">
                      <label htmlFor="wallet_id">Source Wallet</label>
                      <select
                        name="wallet_id"
                        value={walletSlug}
                        readOnly={true}
                      >
                        {(() => {
                          return (
                            <option value={wallet.code}>
                              {wallet.currency} -{' '}
                              {wallet.balance
                                ? wallet.balance.toLocaleString()
                                : 0.0}
                            </option>
                          );
                        })()}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!user.kyc_verified}
                      className="rad-s bg-primary co-white px-2 py-1"
                      onClick={this.generateACHRef}
                    >
                      Request Transfer
                    </button>
{/*
                    {' or '}
                    <button
                      type="button"
                      onClick={() =>
                        this.setState({ showSummary: true, withSummary: false })
                      }
                      className="rad-s bg-primary co-white px-2 py-1"
                    >
                      Upload Payment Proof
                    </button>
*/}
                  </form>
                </div>
              </div>
            ) : (
              <div className="rad-s bg-white p-1 cardshadow" id="ach_summary">
                <p className="mt-0 fw-bold">(2) ACH Transfer Summary</p>
                <div
                  style={{ display: this.state.withSummary ? 'block' : 'none' }}
                >
                  <table>
                    <tbody>
                      <tr>
                        <td>REQUESTER NAME:</td>
                        <td>{user.firstname} {user.lastname}</td>
                      </tr>
                      <tr>
                        <td>AMOUNT:</td>
                        <td>{`${amount} USD`}</td>
                      </tr>
                      <tr>
                        <td>FEE: (0.1% + 50c)</td>
                        <td>{`${amount * 0.001 + 0.50} USD`}</td>
                      </tr>
                      <tr>
                        <td>AMOUNT IN MNDA:</td>
                        <td>
                          {((amount - (amount * 0.001 + 0.50)) / bankData.ex_rate).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 4,
                            },
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>CURRENCY:</td>
                        {/* <td>{walletSlug.toUppecrCase()}</td> */}
                        <td>MNDA</td>
                      </tr>
                      <tr>
                        <td>BANK NAME:</td>
{/*
                        <td>{bankData.account_name}</td>
*/}
                        <td>{user.bank_info.bank_name}</td>
                      </tr>
                      <tr>
                        <td>BANK ACCOUNT:</td>
{/*
                        <td>{bankData.account_number}</td>
*/}
                        <td>{user.bank_info.account_number}</td>
                      </tr>
                      <tr>
                        <td>BANK ROUTING NUMBER:</td>
{/*
                        <td>{bankData.routing_number}</td>
*/}
                        <td>{user.bank_info.sort_code}</td>
                      </tr>
                      <tr>
                        <td>BANK ADDRESS:</td>
{/*
                        <td>{bankData.bank_address}</td>
*/}
                        <td>{user.bank_info.bank_address}</td>
                      </tr>
                      <tr>
                        <td>ACCOUNT TYPE:</td>
{/*
                        <td>{bankData.account_type}</td>
*/}
                        <td>{user.bank_info.account_name}</td>
                      </tr>
                      <tr>
                        <td>MEMO:</td>
                        <td>{achReference}</td>
                      </tr>
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="rad-s bg-primary co-white px-2 py-1 non-printable"
                    onClick={() => window.print()}
                  >
                    Print Summary
                  </button>
                </div>
                <br />
{/*
                <small>
                  Upload a Transaction receipt with your generated reference for
                  verification.
                </small>
*/}
                <form className="non-printable">
{/*
                  <div className="py-h">
                    <label htmlFor="transaction_reference">
                      Transaction Reference used in MEMO
                    </label>
                    <input
                      type="text"
                      name="ach_ref"
                      value={this.state.achReference}
                      onChange={e =>
                        this.setState({ achReference: e.target.value })
                      }
                      placeholder="Paste Transaction Ref/MEMO here"
                    />
                  </div>
*/}
{/*
                  <div>
                    <input type="file" min="1" id="file_ach_proof" />
                  </div>
*/}
                  <br />
                  <button
                    type="button"
                    className="rad-s bg-primary co-white px-2 py-1"
                    onClick={this.sendACHTransferRequest}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
            <div className="pt-2">
              <h4 className="mt-0">ACH Transfer Requests</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Currency</th>
{/*
                      <th>Proof</th>
*/}
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (achTransfers.length < 1) {
                        return (
                          <tr>
                            <td>No Transaction data at this time.</td>
                          </tr>
                        );
                      }
                    })()}
                    {achTransfers.map((data, i) => (
                      <tr key={i + 1}>
                        <td>{data.transaction_reference}</td>
                        <td>{data.amount.toLocaleString()}</td>
                        <td>{data.currency || 'None'}</td>
{/*
                        <td>
                          {data.proof !== '' ? (
                            <a
                              href={data.proof}
                              target="_blank"
                              id={data.proof}
                              onClick={viewGCSObject}
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          ) : (
                            'NO PROOF'
                          )}
                        </td>
*/}
                        <td>{new Date(data.created_at).toDateString()}</td>
                        <td>{renderStatus(data.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                pages={numPages}
                currentPage={currentPage}
                nextPage={this.nextPage}
              />
            </div>
          </div>
          {this.showModalNotification()}
        </section>
      </MainContent>
    );
  }
}
/* eslint-disable */
TopupContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
  location: PropTypes.object,
  dispatch: PropTypes.func,
};

const mapStateToProps = state => {
  const { error, alert } = state.user || {};
  return { error, alert };
};

export default withRouter(connect(mapStateToProps)(TopupContainer));
