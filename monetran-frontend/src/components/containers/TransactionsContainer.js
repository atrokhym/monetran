import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MainContent from '../common/MainContent';
import { renderStatus } from '../../utils/components';
import appService from '../../services/appService';
import * as actions from '../../actions';

class TransactionsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions: [],
    };
  }

  async componentDidMount() {
    try {
      const transactions = await appService.transactions();
      this.setState({ transactions });
    } catch (err) {
      if (err) {
        this.props.dispatch(actions.error(err))
      }
    }
  }

  render() {
    const { user, page } = this.props;
    const { transactions } = this.state;
    return (
      <MainContent user={user} page={page}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <div className="pb-2">
              <h4 className="mt-0">Transactions</h4>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Type</th>
                      <th>With</th>
                      <th>Date</th>
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
                        <td>
                          #
                          {data.transaction_id}
                        </td>
                        <td>{data.type}</td>
                        <td>{data.recipient_name}</td>
                        <td>{new Date(data.created_at).toDateString()}</td>
                        <td>
                          {data.amount.toLocaleString()}
                          {' '}
                          (
                          {data.currency}
                          )
                        </td>
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
TransactionsContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};
export default TransactionsContainer;
