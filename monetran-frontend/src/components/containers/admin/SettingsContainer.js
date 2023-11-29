import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import appService from '../../../services/appService';
import * as actions from '../../../actions';

class SettingsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      settings: [],
      account_name: '',
      account_number: '',
      account_type: '',
      routing_number: '',
      bank_address: '',
      ex_rate: '',
      anchor_withdrawal: '',
      admin_firstname: '',
      admin_lastname: '',
      admin_email: '',
      admin_password: '',
    };
    this.handleInput = this.handleInput.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.createAdmin = this.createAdmin.bind(this);
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    const settings = [];
    const configs = await appService.configs('bank');

    configs.forEach(config => {
      settings[config.label] = config.value;
    });
    const feesConfig = await appService.configs('fees');
    let anchor_withdrawal = 0;
    if (feesConfig.length > 0) {
      anchor_withdrawal = feesConfig.filter(
        value => value.label === 'anchor_withdrawal',
      )[0].value;
    }
    const {
      account_name,
      account_number,
      account_type,
      routing_number,
      bank_address,
      ex_rate,
    } = settings;
    this.setState({
      settings,
      isLoading: false,
      account_name,
      account_number,
      account_type,
      routing_number,
      bank_address,
      ex_rate,
      anchor_withdrawal: anchor_withdrawal,
    });
  }

  handleInput(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  updateSettings(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const {
      account_name,
      account_number,
      account_type,
      bank_address,
      routing_number,
      ex_rate,
      anchor_withdrawal,
    } = this.state;
    const data = {
      account_name,
      account_number,
      account_type,
      bank_address,
      routing_number,
      ex_rate,
      anchor_withdrawal,
    };
    this.props.dispatch(actions.updateSettings(data));
    this.setState({ isLoading: false });
  }

  createAdmin(e) {
    e.preventDefault();
    const {
      admin_firstname,
      admin_lastname,
      admin_email,
      admin_password,
    } = this.state;
    this.props.dispatch(
      actions.createAdmin({
        admin_firstname,
        admin_lastname,
        admin_email,
        admin_password,
      }),
    );
  }
  renderLoading() {
    return <Loader />;
  }

  render() {
    const { isLoading } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Settings</h4>
            <div className="">
              <div className="rad-s bg-white p-1 cardshadow">
                <form>
                  <div className="grid-2-s">
                    <div className="py-h">
                      <label htmlFor="account_name" className="m-0">
                        Account Name
                      </label>
                      <input
                        type="text"
                        name="account_name"
                        value={this.state.account_name}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="account_number">Account Number</label>
                      <input
                        type="text"
                        name="account_number"
                        value={this.state.account_number}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="account_type">Account Type</label>
{/*
                      <input
                        type="text"
                        name="account_type"
                        value={this.state.account_type}
                        onChange={this.handleInput}
                      />
*/}
                      <select 
                        type="text"
                        name="account_type"
                        value={this.state.account_type}
                        onChange={this.handleInput}
                      >
                        <option value="Checking">Checking</option>
                        <option value="Saving">Saving</option>
                      </select>
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="routing_number">Routing Number</label>
                      <input
                        type="text"
                        name="routing_number"
                        value={this.state.routing_number}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="bank_address">Bank Address</label>
                      <input
                        type="text"
                        name="bank_address"
                        value={this.state.bank_address}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="ex_rate">ACH MNDA Exchange Rate</label>
                      <input
                        type="text"
                        name="ex_rate"
                        value={this.state.ex_rate}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="anchor_withdrawal">
                        Withdrawal Fee{' '}
                        <small>This is used to peg MDA to USD</small>
                      </label>
                      <input
                        type="text"
                        name="anchor_withdrawal"
                        value={this.state.anchor_withdrawal}
                        onChange={this.handleInput}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    <div className="d-flx j-c-c py-h">
                      <button
                        type="button"
                        className="rad-s bg-primary co-white px-2 py-1"
                        onClick={this.updateSettings}
                      >
                        Update Settings
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="rad-s bg-white p-1 cardshadow">
                <h4 className="mt-0">Create Admin Account</h4>
                <form>
                  <div className="grid-2-s">
                    <div className="py-h">
                      <label htmlFor="admin_firstname" className="m-0">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="admin_firstname"
                        value={this.state.admin_firstname}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="admin_lastname">Last Name</label>
                      <input
                        type="text"
                        name="admin_lastname"
                        value={this.state.admin_lastname}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="admin_email">Email</label>
                      <input
                        type="text"
                        name="admin_email"
                        value={this.state.admin_email}
                        onChange={this.handleInput}
                      />
                    </div>
                    <div className="py-h m-0">
                      <label htmlFor="admin_password">Password</label>
                      <input
                        type="password"
                        name="admin_password"
                        value={this.state.admin_password}
                        onChange={this.handleInput}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    <div className="d-flx j-c-c py-h">
                      <button
                        type="button"
                        className="rad-s bg-primary co-white px-2 py-1"
                        onClick={this.createAdmin}
                      >
                        Create Admin
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
SettingsContainer.propTypes = {
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

export default withRouter(connect(mapStateToProps)(SettingsContainer));
