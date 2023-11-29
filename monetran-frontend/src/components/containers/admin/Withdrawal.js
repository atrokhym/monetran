import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import adminService from '../../../services/adminService';
import * as actions from '../../../actions';
import { renderStatus } from '../../../utils/components';
import userService from '../../../services/userService';
import appService from '../../../services/appService';
import { calculateWithdrawalPercentage } from '../../../utils';

class Withdrawal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      data: {},
      bankData: {},
      id: null,
      decline_reason: '',
      configs: {},
    };
    this.withdrawalAction = this.withdrawalAction.bind(this);
    this.showDeclineInput = this.showDeclineInput.bind(this);
  }

  async componentDidMount() {
    const { id } = this.props.match.params;
    this.setState({ isLoading: true });
    try {
      const data = await adminService.getWithdrawal(id);
      const bankData = await userService.getBankDetails(data.user_id);
      const configData = await appService.configs('bank');
      const configs = {};
      configData.forEach(config => {
        configs[config.label] = config.value;
      });
      this.setState({ data, isLoading: false, id, bankData, configs });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        return this.props.dispatch(actions.error(err.message));
      }
    }
    return null;
  }

  withdrawalAction(e, action = 'approve') {
    const { id, decline_reason } = this.state;
    this.setState({ isLoading: true });
    try {
      if (action === 'approve') {
        this.props.dispatch(actions.approveWithdrawal(id));
      } else if (action === 'decline') {
        this.props.dispatch(actions.declineWithdrawal(id, decline_reason));
      }
      this.setState({ isLoading: false });
      setTimeout(() => window.location.reload(), 6000);
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
  }

  showDeclineInput(e) {
    e.preventDefault();
    const actionsDiv = document.getElementById('actions');
    const declineInput = document.getElementById('declineInput');
    declineInput.style.display = 'block';
    actionsDiv.style.display = 'none';
  }

  renderLoading() {
    //return <Loader />;
    if(this.state.isLoading) {
         return <span className="Loader">
        <div className="Loader-indicator" >
          <h1>
            <span>Loading</span>
            <span className="Loader-ellipsis" >
              <span className="Loader-ellipsisDot">.</span>
              <span className="Loader-ellipsisDot">.</span>
              <span className="Loader-ellipsisDot">.</span>
            </span>
          </h1>
        </div>
      </span>
    }
    
  }


  render() {
    const { isLoading, bankData, data, configs } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">
              Withdrawal Details for {`${data.first_name} ${data.last_name}`}
            </h4>
            <div className="rad-s bg-white p-1 cardshadow" id="ach_summary">
              <div>
                <table>
                  {(() => {
                    if (bankData.account_name === '') {
                      return (
                        <tr>
                          <td>User doesn't have their banking data set</td>
                        </tr>
                      );
                    }
                    return (
                      <tbody>
                        <tr>
                          <td>Amount In USD</td>
                          <td>${((data.amount - calculateWithdrawalPercentage(data.amount)) * configs.ex_rate).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Amount In MNDA</td>
                          <td>{data.amount ? data.amount.toFixed(4) : 0}</td>
                        </tr>
                        <tr>
                          <td>FEE In MNDA</td>
                          <td>{calculateWithdrawalPercentage(data.amount).toFixed(4) }</td>
                        </tr>
                        <tr>
                          <td>Bank Name</td>
                          <td>{bankData.bank_name}</td>
                        </tr>
                        <tr>
                          <td>Account Type</td>
                          <td>{bankData.account_name}</td>
                        </tr>
                        <tr>
                          <td>Account Number</td>
                          <td>{bankData.account_number}</td>
                        </tr>
                        <tr>
                          <td>Routing/Swift Code</td>
                          <td>{bankData.sort_code}</td>
                        </tr>
                        <tr>
                          <td>Status</td>
                          <td>{renderStatus(data.status)}</td>
                        </tr>
                      </tbody>
                    );
                  })()}
                </table>
                {(() => {
                  if (data.status !== 1 &&
                    data.status !== 2
                  ) {
                    return (
                      <div id="actions">
                        <button
                          type="button"
                          className="rad-s bg-primary co-white px-2 py-1 non-printable"
                          onClick={this.withdrawalAction}
                          style={{ background: 'green' }}
                        >
                          Approve Request
                        </button>{' '}
                        <button
                          style={{ background: 'red' }}
                          className="rad-s bg-primary co-white px-2 py-1 non-printable"
                          onClick={this.showDeclineInput}
                        >
                          Decline
                        </button>
                      </div>
                    );
                  }
                })()}
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
                        onClick={e => this.withdrawalAction(e, 'decline')}
                      >
                        Decline Request
                      </button>
                    </div>
                  </form>
                </div>
                <br />
                <Link to="/admin/withdrawals">All Withdrawal Requests</Link>
              </div>
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
Withdrawal.propTypes = {
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

export default withRouter(connect(mapStateToProps)(Withdrawal));
