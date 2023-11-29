import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as actions from '../../actions';

class Header extends Component {
  constructor(props) {
    super(props);
    this.showMenu = this.showMenu.bind(this);
    this.showdrop = this.showdrop.bind(this);
    this.mobileNav = document.querySelector('.mobile-nav');
    this.state = {
      showMenu: false,
    };
    this.activeMenu = React.createRef();
    this.setActiveMenu = this.setActiveMenu.bind(this);
  }

  async componentDidMount() {
    this.setActiveMenu();
  }

  componentWillUnmount() {
    document
      .querySelector('.dropdown')
      .removeEventListener('click', this.showdrop, true);
    document
      .querySelector('.mobile-nav')
      .removeEventListener('click', this.showMenu, true);
  }

  setActiveMenu() {
    const { page } = this.props;
    const link = document.querySelector(`[data-menu-tag=${page}]`);
    if (!link) {
      return;
    }
    if (page === link.getAttribute('data-menu-tag')) {
      link.classList.add('active-dot');
    }
  }

  showdrop() {
    this.setState(prevState => ({ showMenu: !prevState.showMenu }));
    document.querySelector('.dropdown').classList.toggle('open');
  }

  showMenu(e) {
    e.target.classList.toggle('change');
    document.querySelector('.mobile-nav').classList.toggle('open-nav');
    this.setState(prevState => ({ showMenu: !prevState.showMenu }));
  }

  renderFlashMessage() {
    const { error, alert, dispatch, page } = this.props || this.props.location;
    if (error) {
      setTimeout(() => dispatch(actions.clearFlashMessages()), 13000);
      // setTimeout(() => window.location.reload(), 1000);
      return <div className="error-msg">{error}</div>;
    }
    if (alert) {
      setTimeout(() => dispatch(actions.clearFlashMessages()), 15000);
      if (page === 'overview' || page === 'wallets' || page === 'transfers') {
        setTimeout(() => window.location.reload(), 1000);
      }
      return <div className="success-msg">{alert}</div>;
    }
    return null;
  }

  renderMenus() {
    const { is_admin } = this.props;
    if (!is_admin) return this.renderMainMenu();
    return this.renderAdminMenu();
  }

  renderAdminMenu() {
    return (
      <ul className="none al-i-c topmenu">
        <li
          className="prefix is-even-wider px-1"
          data-menu-tag="admin_overview"
        >
          <Link to="/admin/overview" className="d-blk py-1 co-richblack">
            Dashboard
          </Link>
        </li>
        <li
          className="prefix is-even-wider px-1"
          data-menu-tag="admin_ach_transfers"
        >
          <Link to="/admin/transfers" className="d-blk py-1 co-richblack">
            ACH Transfers
          </Link>
        </li>
        <li className="prefix is-even-wider px-1" data-menu-tag="admin_kyc">
          <Link to="/admin/kyc" className="d-blk py-1 co-richblack">
            KYC
          </Link>
        </li>
        <li
          className="prefix is-even-wider px-1"
          data-menu-tag="admin_withdrawals"
        >
          <Link to="/admin/withdrawals" className="d-blk py-1 co-richblack">
            Withdrawals
          </Link>
        </li>
        <li className="prefix is-even-wider px-1" data-menu-tag="admin_charges">
          <Link to="/admin/charges" className="d-blk py-1 co-richblack">
            Charges
          </Link>
        </li>
        <li
          className="prefix is-even-wider px-1"
          data-menu-tag="admin_settings"
        >
          <Link to="/admin/settings" className="d-blk py-1 co-richblack">
            Settings
          </Link>
        </li>
      </ul>
    );
  }

  renderMainMenu() {
    return (
      <ul className="none al-i-c topmenu">
        <li className="prefix is-even-wider px-1" data-menu-tag="dashboard">
          <Link to="/" className="d-blk py-1 co-richblack">
            Dashboard
          </Link>
        </li>
        <li className="prefix is-even-wider px-1" data-menu-tag="wallets">
          <Link to="/wallets" className="d-blk py-1 co-richblack">
            Wallets
          </Link>
        </li>
        {/*
        <li className="prefix is-even-wider px-1" data-menu-tag="transactions">
          <Link to="/transactions" className="d-blk py-1 co-richblack">
            Transactions
          </Link>
        </li>*/}
        <li className="prefix is-even-wider px-1" data-menu-tag="topup">
          <Link to="/top-up" className="d-blk py-1 co-richblack">
            Add Funds
          </Link>
        </li>
        <li className="prefix is-even-wider px-1" data-menu-tag="withdrawals">
          <Link to="/withdrawals" className="d-blk py-1 co-richblack">
            Redeem MNDA
          </Link>
        </li>
        <li className="prefix is-even-wider px-1" data-menu-tag="p2p">
          <Link to="/transfers/p2p" className="d-blk py-1 co-richblack">
            Transfer
          </Link>
        </li>
      </ul>
    );
  }

  render() {
    const { firstname, lastname, image_url } = this.props;
    return (
      <div>
        <header className="site-header pos-a fixed-to-top non-printable">
          <div className="bg-primary">
            <div className="maxwidth-xl mx-auto wrapper-x">
              <div className="d-flx j-c-sb al-i-c py-h">
                <div className="logo">
                  <Link to="/" className="d-flx co-white al-i-c">
                    <h3 className="m-0">Monetran</h3>
                  </Link>
                </div>

                <div className="d-flx al-i-c topmenu">
                  <div
                    className="d-blk px-h py-h prefix rad-s bg-comp dropdown pos-r"
                    onClick={this.showdrop}
                    onKeyDown={() => {}}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M1 1L8 8L15 1" stroke="white" strokeWidth="2" />
                    </svg>
                    <ul className="none drop bg-white pos-a cardshadow rad-s">
                      <li className="rad-s">
                        <Link to="/account" className="d-blk p-hh co-richblack">
                          My Account
                        </Link>
                      </li>
                      <li className="rad-s">
                        <Link to="/logout" className="d-blk p-hh co-richblack">
                          Logout
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <span className="co-white p-1 show-mediumup">
                    {`${firstname} ${lastname}`}
                  </span>
                  <img
                    src={
                      image_url !== ''
                        ? image_url
                        : 'https://img.favpng.com/2/12/12/computer-icons-portable-network-graphics-user-profile-avatar-png-favpng-L1ihcbxsHbnBKBvjjfBMFGbb7.jpg'
                    }
                    className="small-avatar d-blk suffix rad-c border-circle"
                    alt="avatar"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white cardshadow">
            <div className="maxwidth-xl mx-auto wrapper-x d-flx j-c-c">
              <nav className="d-flx j-c-sb al-i-c">{this.renderMenus()}</nav>
            </div>

            <div className="j-c-sb al-i-c wrapper-x py-1 flex-hide-mediumup">
              <span className="co-richblack">{`${firstname} ${lastname}`}</span>
              <div
                className="nav-menu"
                onClick={this.showMenu}
                onKeyDown={() => {}}
                role="button"
                tabIndex={0}
              >
                <div className="bar1" />
                <div className="bar2" />
                <div className="bar3" />
              </div>
            </div>
          </div>
          {this.renderFlashMessage()}
          <br />
        </header>
        <div className="mobile-nav pos-a fixed-to-top bg-home-mobile">
          <ul className="sub-ul none tx-c">
            <li className="prefix px-1 sublist-class">
              <Link to="/overview" className="d-blk py-1 co-richblack">
                Dashboard
              </Link>
            </li>
            <li className="prefix px-1 sublist-class">
              <Link to="/wallets" className="d-blk py-1 co-richblack">
                Wallets
              </Link>
            </li>
            <li className="prefix px-1">
              <Link to="/top-up" className="d-blk py-1 co-richblack">
                Add Funds
              </Link>
            </li>
            <li className="prefix px-1">
              <Link to="/withdrawals" className="d-blk py-1 co-richblack">
                Redeem MNDA
              </Link>
            </li>
            <li className="prefix px-1">
              <Link to="/transfers/p2p" className="d-blk py-1 co-richblack">
                Transfer
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

Header.defaultProps = {
  firstname: '',
  lastname: '',
  error: '',
  alert: '',
  image_url: '',
};

Header.propTypes = {
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  image_url: PropTypes.string.isRequired,
  page: PropTypes.string,
  error: PropTypes.string,
  alert: PropTypes.string,
};

const mapStateToProps = state => {
  const { error, alert } = state.user || {};
  const { user } = state.session || {};
  return { error, alert, user };
};

export default connect(mapStateToProps)(Header);
