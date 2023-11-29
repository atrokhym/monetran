import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import IdleTimer from 'react-idle-timer';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { LOGOUT_INTERVAL } from '../utils/config';
import AccountContainer from '../components/containers/AccountContainer';
import AdminTransfersContainer from '../components/containers/admin/TransfersContainer';
import AdminWithdrawalsContainer from '../components/containers/admin/Withdrawals';
import ChargesContainer from '../components/containers/admin/ChargesContainer';
import Container from '../components/containers/admin/Container';
import KYCContainer from '../components/containers/admin/KYCContainer';
import OverviewContainer from '../components/containers/OverviewContainer';
import SettingsContainer from '../components/containers/admin/SettingsContainer';
import TopupContainer from '../components/containers/TopupContainer';
import TransactionsContainer from '../components/containers/TransactionsContainer';
import Transfer from '../components/containers/admin/Transfer';
import TransfersContainer from '../components/containers/TransfersContainer';
import TransfersP2pContainer from '../components/containers/TransfersP2pContainer';
import WalletContainer from '../components/containers/WalletContainer';
import Withdrawal from '../components/containers/admin/Withdrawal';
import WithdrawalsContainer from '../components/containers/WithdrawalsContainer';

// useMergedProps renders the merged props from component
const useMergedProps = (component, ...rest) => {
  const props = Object.assign({}, ...rest); // save final props
  return React.createElement(component, props);
};

// AppRoute renders a route with merged props and component
/* eslint-disable */
export const PropsRoute = ({ component, ...rest }) => {
  return (
    <Route {...rest} render={props => useMergedProps(component, props, rest)} />
  );
};

class AppRoutes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isTimedOut: false,
    };
    this.idleTImer = null;
  }
  onAction = e => {
    this.setState({ isTimedOut: false });
  };
  onActive = e => {
    this.setState({ isTimedOut: false });
  };
  onIdle = e => {
    const { isTimedOut } = this.state;
    if (isTimedOut) return this.props.history.push('/logout');
    // reset timer
    this.idleTimer.reset();
    this.setState({ isTimedOut: true });
  };

  render() {
    const { authenticate, user } = this.props;
    return (
      <div>
        <IdleTimer
          ref={ref => {
            this.idleTimer = ref;
          }}
          element={document}
          onActive={this.onActive}
          onIdle={this.onIdle}
          onAction={this.onAction}
          debounce={250}
          timeout={LOGOUT_INTERVAL * 60000}
        />
        {/* your app here */}
        <Switch>
          <PropsRoute
            component={OverviewContainer}
            page="dashboard"
            user={user}
            authenticate={authenticate}
            path="/overview"
          />
          <PropsRoute
            component={WalletContainer}
            page="wallets"
            user={user}
            authenticate={authenticate}
            path="/wallets"
          />
          <PropsRoute
            component={TransactionsContainer}
            page="transactions"
            user={user}
            authenticate={authenticate}
            path="/transactions"
          />
          <PropsRoute
            component={TopupContainer}
            page="topup"
            user={user}
            authenticate={authenticate}
            path="/top-up"
          />
          <PropsRoute
            component={WithdrawalsContainer}
            page="withdrawals"
            user={user}
            authenticate={authenticate}
            path="/withdrawals"
          />
          <PropsRoute
            component={TransfersContainer}
            page="transfers"
            user={user}
            authenticate={authenticate}
            path="/transfers"
            exact
          />
          <PropsRoute
            component={TransfersP2pContainer}
            page="p2p"
            user={user}
            authenticate={authenticate}
            path="/transfers/p2p"
            exact
          />
          <PropsRoute
            component={AccountContainer}
            page="account"
            user={user}
            authenticate={authenticate}
            path="/account"
          />
          {/* Admin routes */}
          <PropsRoute
            component={Container}
            page="admin_overview"
            user={user}
            authenticate={authenticate}
            path="/admin/overview"
            exact
          />
          <PropsRoute
            component={AdminTransfersContainer}
            page="admin_ach_transfers"
            user={user}
            authenticate={authenticate}
            path="/admin/transfers"
            exact
          />
          <PropsRoute
            component={Transfer}
            page="admin_ach_transfers"
            user={user}
            authenticate={authenticate}
            path="/admin/transfers/:id"
          />
          <PropsRoute
            component={KYCContainer}
            page="admin_kyc"
            user={user}
            authenticate={authenticate}
            path="/admin/kyc"
            exact
          />
          <PropsRoute
            component={AdminWithdrawalsContainer}
            page="admin_withdrawals"
            user={user}
            authenticate={authenticate}
            path="/admin/withdrawals"
            exact
          />
          <PropsRoute
            component={Withdrawal}
            page="admin_withdrawals"
            user={user}
            authenticate={authenticate}
            path="/admin/withdrawals/:id"
          />
          <PropsRoute
            component={ChargesContainer}
            page="admin_charges"
            user={user}
            authenticate={authenticate}
            path="/admin/charges"
          />
          <PropsRoute
            component={SettingsContainer}
            page="admin_settings"
            user={user}
            authenticate={authenticate}
            path="/admin/settings"
            exact
          />
          <Route
            path="/"
            render={props => (
              <Redirect to={user.is_admin ? '/admin/overview' : '/overview'} />
            )}
          />
        </Switch>
      </div>
    );
  }
}

AppRoutes.propTypes = {
  authenticate: PropTypes.bool,
  user: PropTypes.object,
};

export default withRouter(AppRoutes);
