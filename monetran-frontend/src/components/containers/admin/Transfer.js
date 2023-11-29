import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import adminService from '../../../services/adminService';
import userService from '../../../services/userService';
import appService from '../../../services/appService';
import * as actions from '../../../actions';
import { renderStatus } from '../../../utils/components';
import { viewGCSObject } from '../../../utils';

class Transfer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      data: {},
      bankData: {},
      id: null,
      userBankInfo: {},
      decline_reason: '',
    };
    this.creditUser = this.creditUser.bind(this);
    this.declineRequest = this.declineRequest.bind(this);
  }

  async componentDidMount() {
    const { id } = this.props.match.params;
    const { bankData } = this.state;
    this.setState({ isLoading: true });
    try {
      const data = await adminService.getACHTransfer(id);
      const userBankInfo = await userService.getBankDetails(data.user_id);      
      const configs = await appService.configs('bank');
      configs.forEach(config => {
        bankData[config.label] = config.value;
      });
      this.setState({ data, isLoading: false, id, userBankInfo});
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        return this.props.dispatch(actions.error(err.message));
      }
    }
    return null;
  }

  showDeclineInput(e) {
    e.preventDefault();
    const actionsDiv = document.getElementById('actions');
    const declineInput = document.getElementById('declineInput');
    declineInput.style.display = 'block';
    actionsDiv.style.display = 'none';
  }

  creditUser(e) {
    e.preventDefault();    
    const { id } = this.state;
    this.setState({ isLoading: true });
    try {
      this.props.dispatch(actions.achCreditUser(id));
      this.setState({ isLoading: false });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
  }

  declineRequest(e) {
    e.preventDefault();
    const { id, decline_reason } = this.state;
    this.setState({ isLoading: true });
    try {
      this.props.dispatch(actions.declineAchRequest(id, decline_reason));
      this.setState({ isLoading: false });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
  }

  renderLoading() {
    return <Loader />;
  }

  render() {
    const { isLoading, bankData, userBankInfo, data } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">ACH Debit Transfer</h4>
            <div className="rad-s bg-white p-1 cardshadow" id="ach_summary">
              <div>
                <table>
                  <tbody>
                    <tr>
                      <td>REQUESTER NAME:</td>
                      <td>{`${data.first_name} ${data.last_name}`}</td>
                    </tr>
                    <tr>
                      <td>AMOUNT:</td>
                      <td>${data.amount ? data.amount.toFixed(3) : 0}</td>
                    </tr>
                    <tr>
                      <td>FEE: (0.1% + 50c)</td>
                      <td>${data.amount * 0.001 + 0.50}</td>
                    </tr>
                    <tr>
                      <td>AMOUNT IN MNDA:</td>
                      <td>{((data.amount - (data.amount * 0.001 + 0.50)) / bankData.ex_rate).toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td>CURRENCY:</td>
                      <td>
                        {data.currency ? data.currency.toUpperCase() : 'NIL'}
                      </td>
                    </tr>
                    <tr>
                      <td>BANK NAME:</td>
                      <td>{userBankInfo.bank_name}</td>
                    </tr>
                    <tr>
                      <td>BANK ACCOUNT:</td>
                      <td>{userBankInfo.account_number}</td>
                    </tr>
                    <tr>
                      <td>BANK ROUTING NUMBER:</td>
                      <td>{userBankInfo.sort_code}</td>
                    </tr>
                    <tr>
                      <td>BANK ADDRESS:</td>
                      <td>{userBankInfo.bank_address}</td>
                    </tr>
                    <tr>
                      <td>ACCOUNT TYPE:</td>
                      <td>{userBankInfo.account_name}</td>
                    </tr>
                    <tr>
                      <td>MEMO:</td>
                      <td>{data.transaction_reference}</td>
                    </tr>
{/*
                    <tr>
                      <td>Transfer Proof:</td>
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
                    </tr>
*/}
                    <tr>
                      <td>SEND DATE:</td>
                      <td>{new Date(data.created_at).toDateString()}</td>
                    </tr>
                    <tr>
                      <td>TRANSFER STATUS:</td>
                      <td>{renderStatus(data.status)}</td>
                    </tr>
                  </tbody>
                </table>
                {(() => {
                  if (
                    data.status !== 1 
                    && data.status !== 2 
                    //&& data.proof !== ''
                  ) {
                    return (
                      <div id="actions">
                        <button
                          type="button"
                          className="rad-s bg-primary co-white px-2 py-1 non-printable"
                          onClick={this.creditUser}
                          style={{ background: 'green' }}
                        >
                          Credit User
                        </button>{' '}
                        {(() => {
                          if (data.status !== 2) {
                            return (
                              <button
                                type="button"
                                className="rad-s bg-primary co-white px-2 py-1 non-printable"
                                onClick={this.showDeclineInput}
                                style={{ background: 'red' }}
                              >
                                Decline
                              </button>
                            );
                          }
                        })()}
                      </div>
                    );
                  } else {
{/*
                    if (data.status !== 1) {
                      return (
                        <mark>
                          Actions disabled as payment proof isn't uploaded yet.
                        </mark>
                      );
                    }
*/}
                  }
                })()}
                <br />
                <div>
                  <button
                    type="button"
                    className="rad-s bg-primary co-white px-2 py-1 non-printable"
                    onClick={() => window.print()}
                  >
                    Print Summary
                  </button>
                </div>
                <div id="declineInput" style={{ display: 'none' }}>
                  <form>
                    <div className="py-h">
                      <label htmlFor="decline_reason">
                        State the reason for declining this request
                      </label>
                      <input
                        type="text"
                        name="decline_reason"
                        value={this.state.decline_reason}
                        onChange={e =>
                          this.setState({ [e.target.name]: e.target.value })
                        }
                      />
                      <br />
                      <button
                        style={{ background: 'red' }}
                        className="rad-s bg-primary co-white px-2 py-1 non-printable"
                        onClick={this.declineRequest}
                      >
                        Decline Request
                      </button>
                    </div>
                  </form>
                </div>
                <br />
                <Link to="/admin/transfers">All ACH Transfer Requests</Link>
              </div>
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
Transfer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};

const mapStateToProps = state => {
  const { isFetching, error, alert } = state.user || {};
  const { checked, authenticated, user } = state.session || {};
  return {
    isFetching,
    checked,
    authenticated,
    user,
    error,
    alert,
  };
};

export default withRouter(connect(mapStateToProps)(Transfer));
