import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import adminService from '../../../services/adminService';
import * as actions from '../../../actions';
import { renderStatus } from '../../../utils/components';

class TransfersContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      transfers: [],
    };
    this.purgeTransfers = this.purgeTransfers.bind(this);
  }

  async componentDidMount() {
    try {
      const transfers = await adminService.transfers();
      this.setState({ transfers, isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        return this.props.dispatch(actions.error(err.message));
      }
    }
    return null;
  }
  renderLoading() {
    return <Loader />;
  }

  async purgeTransfers(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    await adminService.purgeTransfers();
    const transfers = await adminService.transfers();
    this.setState({ transfers, isLoading: false });
    this.props.dispatch(actions.alert('Inactive ACH Transfers purged'));
  }

  render() {
    const { isLoading, transfers } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">ACH Transfer Requests</h4>
{/*
            <div className="d-flx py-h">
              <button
                type="button"
                className="rad-s bg-primary co-white px-2 py-1"
                onClick={this.purgeTransfers}
              >
                Purge Inactive Requests
              </button>
            </div>
*/}
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>From</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Date</th>
                    <th>Status</th>
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
                      <td>{data.transaction_reference}</td>
                      <td>{`${data.first_name} ${data.last_name}`}</td>
                      <td>{data.amount.toLocaleString()}</td>
                      <td>USD</td>
                      <td>{new Date(data.created_at).toDateString()}</td>
                      <td>
                        <small>{renderStatus(data.status)}</small>
                      </td>
                      <td>
                        <Link to={`/admin/transfers/${data.id}`}>
                          <button className="w-100 b-rad-s bg-primary co-white py-1">
                            View
                          </button>
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
TransfersContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
  id: PropTypes.string,
  dispatch: PropTypes.func,
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

export default withRouter(connect(mapStateToProps)(TransfersContainer));
