import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import MainContent from '../common/MainContent';
import appService from '../../services/appService';
import userService from '../../services/userService';
import * as actions from '../../actions';

class TransfersContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recipient_name: '',
      recipient_phone: '',
      amount: '',
      account_name: '',
      account_number: '',
      bank_name: '',
      sort_code: '',
      country: '',
      wallet: {},
      transferText: '',
      showSummary: false,
      cowriesData: {},
      ngnValue: 0,

    };
    this.currToNGN = this.currToNGN.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.proceed = this.proceed.bind(this);
    this.transfer = this.transfer.bind(this);
  }

  async componentDidMount() {
    const userWallets = await userService.wallets();
    const wallet = userWallets.find(e => e.code === 'XLM');
    document.querySelector('.hd').style.display = 'none';
    document.querySelector('.hds').style.display = 'none';
    this.setState({ wallet });
  }

  async currToNGN() {
    const { amount } = this.state;
    const ngnPrice = await appService.xlmToNgnt(amount);
    return parseFloat(ngnPrice);
  }

  handleInput(e) {
    e.preventDefault();
    if (e.target.name === 'country' && e.target.value === 'Nigeria') {
      document.querySelector('.hd').style.display = 'block';
      document.querySelector('.hds').style.display = 'block';
    }
    this.setState({ [e.target.name]: e.target.value });
  }

  async proceed(e) {
    e.preventDefault();
    try {
      const { sort_code, account_number } = this.state;
      const amount = this.state.amount || 0;
      const ngnvalue = await this.currToNGN();
      const transferText = `Making Transfer of XLM ${parseFloat(amount).toLocaleString()} @ NGN ${ngnvalue.toLocaleString()}`;
      const cowries_data = await appService.getCowrieData({ sort_code, account_number });
      this.setState({
        transferText,
        showSummary: true,
        cowriesData: cowries_data,
        ngnValue: ngnvalue,
      });
    } catch (err) {
      if (err) this.props.dispatch(actions.error(err.message));
    }
  }

  transfer(e) {
    e.preventDefault();
    const data = {};
    Object.assign(data, this.state);
    data.wallet_id = data.wallet.id;
    data.currency = data.wallet.code;
    data.amount = parseFloat(data.amount);
    delete data.wallet;
    delete data.transferText;
    this.props.dispatch(actions.transferRequest(data));
  }

  renderTransferSummary() {
    const { cowriesData } = this.state;
    const { user, page } = this.props;
    return (
      <MainContent user={user} page={page}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Transfer Summary</h4>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <tbody>
                  <tr>
                    <td>Bank of the Recipient</td>
                    <td>{this.state.bank_name}</td>
                  </tr>
                  <tr>
                    <td>Amount</td>
                    <td>
                      {this.state.ngnValue.toLocaleString()}
                      {' '}
                      NGNT
                    </td>
                  </tr>
                  <tr>
                    <td>Fee</td>
                    <td>
                      {cowriesData.fee}
                      {' '}
                      NGNT
                    </td>
                  </tr>
                  <tr>
                    <td>Amount Deducted (w/ App fees)</td>
                    <td>
                      {parseFloat(this.state.amount) + cowriesData.app_fees}
                      {' '}
                      XLM
                    </td>
                  </tr>
                  <tr>
                    <td>Extra Info</td>
                    <td>{cowriesData.extra_info}</td>
                  </tr>
                </tbody>
              </table>
              <div className="d-flx j-c-c py-h" id="transfer_btn">
                <div className="d-flx j-c-c py-h">
                  <button type="button" className="rad-s bg-primary co-white px-2 py-1" onClick={this.transfer}>
                    Complete Transfer
                  </button>
                </div>
              </div>
              <div className="d-flx j-c-c py-h" id="transfer_btn">
                <div className="d-flx j-c-c py-h">
                  <button type="button" className="rad-s bg-lightgray co-white px-2 py-1" onClick={() => { this.setState({ showSummary: false }); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </MainContent>
    );
  }

  render() {
    const { user, page } = this.props;
    const { wallet, showSummary } = this.state;
    if (!showSummary) {
      return (
        <MainContent user={user} page={page}>
          <section className="width-100-pc">
            <div className="maxwidth-sl mx-auto wrapper">
              <h4 className="mt-0">New Transfer</h4>
              <h3>
                XLM Wallet Balance:
                {' '}
                {wallet.balance}
              </h3>
              <div className="rad-s mt-2 bg-white p-1 cardshadow">
                <p className="mt-0 fw-bold">Transfer Details</p>
                <p><i>Please fill in recipient's details</i></p>
                <form>
                  <div className="grid-2-s">
                    <div className="py-h">
                      <label htmlFor="fullname" className="m-0">Name</label>
                      <input type="text" name="recipient_name" value={this.state.recipient_name} onChange={this.handleInput} />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="phone_number">Phone Number</label>
                      <input type="text" name="recipient_phone" value={this.state.recipient_phone} onChange={this.handleInput} />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="bank_name">Amount (XLM)</label>
                      <input type="text" name="amount" value={this.state.amount} onChange={this.handleInput} />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="account_name">Account Type</label>
                      <input type="text" name="account_name" value={this.state.account_name} onChange={this.handleInput} />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="account_number">Account Number</label>
                      <input type="text" name="account_number" value={this.state.account_number} onChange={this.handleInput} />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="country">Country</label>
                      <select name="country" value={this.state.country} onChange={this.handleInput}>
                        <option value="">Select Country</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                      </select>
                    </div>
                    <div className="py-h m-0 hd">
                      <label htmlFor="bank_name">Bank Name</label>
                      <input type="text" name="bank_name" value={this.state.bank_name} onChange={this.handleInput} />
                    </div>
                    <div className="py-h m-0 hds">
                      <label htmlFor="sort_code">Bank Sort Code</label>
                      <select name="sort_code" value={this.state.sort_code} onChange={this.handleInput}>
                        <option>Select Bank Sort Code</option>
                        <option value="000014">AccessBank	- 000014</option>
                        <option value="000009">CitiBank	- 000009</option>
                        <option value="000005">DiamondBank - 000005</option>
                        <option value="000010">Ecobank - 000010</option>
                        <option value="000019">EnterpriseBank	- 000019</option>
                        <option value="000003">FCMB	- 000003</option>
                        <option value="000007">FidelityBank	- 000007</option>
                        <option value="000016">FirstBank	- 000016</option>
                        <option value="000013">GTBank	- 000013</option>
                        <option value="000020">Heritage	- 000020</option>
                        <option value="000002">KeystoneBank	- 000002</option>
                        <option value="000008">SkyeBank	- 000008</option>
                        <option value="000012">Stanbic	- 000012</option>
                        <option value="000021">StandardChartered	- 000021</option>
                        <option value="000001">SterlingBank	- 000001</option>
                        <option value="000004">UBA	- 000004</option>
                        <option value="000018">UnionBank	- 000018</option>
                        <option value="000011">UnityBank	- 000011</option>
                        <option value="000017">WemaBank	- 000017</option>
                        <option value="000015">ZenithBank	- 000015</option>
                      </select>
                    </div>
                  </div>
                  <div className="py-1" id="proceed_btn">
                    <div className="d-flx j-c-c py-h">
                      <button type="button" className="rad-s bg-primary co-white px-2 py-1" onClick={this.proceed}>
                        Verify Details
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </MainContent>
      );
    }
    return this.renderTransferSummary();
  }
}
/* eslint-disable */
TransfersContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};

export default connect(null)(TransfersContainer);