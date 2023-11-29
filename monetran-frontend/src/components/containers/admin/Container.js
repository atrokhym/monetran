import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import appService from '../../../services/appService';
import * as actions from '../../../actions';
import adminService from '../../../services/adminService';
import { renderStatus } from '../../../utils/components';
import { viewGCSObject } from '../../../utils';

class Container extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      recentWithdrawals: [],
      recentACHTransfers: [],
      recentKYCUploads: [],
      xlmBalance: 0,
      mndaBalance: 0,
      xlm_price: 0,
    };
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    try {
      const overviewData = await adminService.overview();
      const {
        recentWithdrawals,
        recentACHTransfers,
        recentKYCUploads,
        xlmBalance,
        mndaBalance,
      } = overviewData;
      const xlmPrice = await appService.xlmPrice();
      this.setState({
        isLoading: false,
        recentACHTransfers,
        recentKYCUploads,
        recentWithdrawals,
        xlmBalance,
        mndaBalance,
        xlmPrice,
      });
    } catch (err) {
      if (err) {
        return this.props.dispatch(actions.error(err.message));
      }
    }
  }

  renderLoading() {
    return <Loader />
  }

  render() {
    const {
      isLoading, xlmBalance,
      mndaBalance, xlmPrice,
      recentWithdrawals,
      recentACHTransfers,
      recentKYCUploads,
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
                <div>
                  <div className="rad-s b-rad-s bg-white cardshadow">
                    <div className="p-1">
                      <p className="mb-0">XLM (Stellar Lumen)</p>
                      <h3 className="m-0">
                        {xlmBalance.toLocaleString() || 0}
                        {' '}
                        - value (${(xlmBalance * xlmPrice).toLocaleString()})
                      </h3>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="rad-s b-rad-s bg-white cardshadow">
                    <div className="p-1">
                      <p className="mb-0">MNDA (Moneda)</p>
                      <h3 className="m-0">
                        {mndaBalance.toLocaleString() || 0}
                        {' '}
                        - value (${(mndaBalance * xlmPrice).toLocaleString()})
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <h4 className="mt-0">Recent Withdrawals</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (recentWithdrawals.length < 1) {
                        return (
                          <tr>
                            <td>No Transaction data at this time.</td>
                          </tr>
                        );
                      }
                    })()}
                    {recentWithdrawals.map((data, i) => (
                      <tr key={i + 1}>
                        <td>{`${data.first_name} ${data.last_name}`}</td>
                        <td>
                          {data.amount.toLocaleString()}
                        </td>
                        <td>{data.currency || 'None'}</td>
                        <td>{new Date(data.created_at).toDateString()}</td>
                        <td>{renderStatus(data.status)}</td>
                        <td>
                          <Link to={`/admin/withdrawals/${data.id}`} >
                            <button className="w-100 b-rad-s bg-primary co-white py-1">View</button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/admin/withdrawals"><p>View All Withdrawal Requests</p></Link>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="mt-0">Recent ACH Transfer Requests</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>From</th>
                      <th>Amount</th>
                      <th>Currency</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (recentACHTransfers.length < 1) {
                        return (
                          <tr>
                            <td>No Transaction data at this time.</td>
                          </tr>
                        );
                      }
                    })()}
                    {recentACHTransfers.map((data, i) => (
                      <tr key={i + 1}>
                        <td>
                          {data.transaction_reference}
                        </td>
                        <td>{`${data.first_name} ${data.last_name}`}</td>
                        <td>
                          {data.amount.toLocaleString()}
                        </td>
                        <td>{data.currency || 'None'}</td>
                        <td>{new Date(data.created_at).toDateString()}</td>
                        <td>
                          <Link to={`/admin/transfers/${data.id}`}>
                            <button className="w-100 b-rad-s bg-primary co-white py-1">View</button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/admin/transfers"><p>View All ACH Transfer Requests</p></Link>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="mt-0">Recent KYC Uploads</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Upload Date</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (recentKYCUploads.length < 1) {
                        return (
                          <tr>
                            <td>No kyc data at this time.</td>
                          </tr>
                        );
                      }
                    })()}
                    {recentKYCUploads.map((data, i) => (
                      <tr key={i + 1}>
                        <td>{`${data.first_name} ${data.last_name}`}</td>
                        <td>{data.type.toUpperCase()}</td>
                        <td>{new Date(data.created_at).toDateString()}</td>
                        <td>
                          <a href={data.filename} id={data.filename} target="_blank" rel="noopener noreferrer" onClick={viewGCSObject}>
                            view
                          </a>
                        </td>
                        <td>
                          <Link to={`/admin/kyc?action=approve&doc=${data.id}`}>
                            <button type="button" className="w-100 b-rad-s bg-primary co-white py-1">Approve</button>
                          </Link>
                        </td>
                        <td>
                          <Link to={`/admin/kyc?action=decline&doc=${data.id}`}>
                            <button style={{ background: 'red' }} type="button" className="w-100 b-rad-s bg-primary co-white py-1">Decline</button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Link to="/admin/kyc"><p>View All KYC Uploads</p></Link>
              </div>
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
Container.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};

const mapStateToProps = (state) => {
  const {
    isFetching, error, alert,
  } = state.user || {};
  const {
    checked, authenticated, user,
  } = state.session || {};
  return {
    isFetching, checked, authenticated, user, error, alert,
  };
};

export default withRouter(connect(mapStateToProps)(Container));
