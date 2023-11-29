import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import * as actions from '../../../actions';
import adminService from '../../../services/adminService';
import { renderStatus } from '../../../utils/components';

class WithdrawalsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      withdrawals: [],
    };
  }

  renderLoading() {
    return <Loader />
  }

  async componentDidMount() {
    const { dispatch } = this.props;
    this.setState({ isLoading: false });
    try {
      const withdrawals = await adminService.withdrawals();
      this.setState({ withdrawals, isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        return dispatch(actions.error(err.message));
      }
    }
    return null;
  }

  render() {
    const { isLoading, withdrawals } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Withdrawals</h4>
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
                      <td>{`${data.first_name} ${data.last_name}`}</td>
                      <td>
                        {data.amount.toLocaleString()}
                      </td>
                      <td>{data.currency || 'None'}</td>
                      <td>{new Date(data.created_at).toDateString()}</td>
                      <td>
                        {renderStatus(data.status)}
                      </td>
                      <td>
                        <Link to={`/admin/withdrawals/${data.id}`} >
                          <button className="w-100 b-rad-s bg-primary co-white py-1">View</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  dispatch: PropTypes.func,
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

export default withRouter(connect(mapStateToProps)(WithdrawalsContainer));
