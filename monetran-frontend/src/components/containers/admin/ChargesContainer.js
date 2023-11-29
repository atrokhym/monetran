import React from 'react';
import { withRouter } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import adminService from '../../../services/adminService';
import Loader from '../../common/Loader';

class ChargesContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      fees: [],
    };
  }
  async componentDidMount() {
    this.setState({ isLoading: true });
    const fees = await adminService.getCharges();
    this.setState({ fees, isLoading: false });
  }

  renderLoading() {
    return <Loader />
  }
  render() {
    const { isLoading, fees } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Fee Charges</h4>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Charged To</th>
                    <th>Base Amount</th>
                    <th>Fee Charged</th>
                    <th>Currency</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (fees.length < 1) {
                      return (
                        <tr>
                          <td>No Charges data at this time.</td>
                        </tr>
                      );
                    }
                  })()}
                  {fees.map((fee, i) => (
                    <tr key={i + 1}>
                      <td>{fee.type.toUpperCase()}</td>
                      <td>{fee.full_name}</td>
                      <td>{fee.base_amount.toLocaleString()}</td>
                      <td>{fee.amount_charged.toLocaleString()}</td>
                      <td>{fee.currency}</td>
                      <td>{new Date(fee.created_at).toDateString()}</td>
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

export default withRouter(ChargesContainer);