import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';


class AdminSettingsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
    };
  }

  renderLoading() {
    return <Loader />
  }

  render() {
    const { isLoading } = this.state;
    const { user } = this.props;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">Settings</h4>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
AdminSettingsContainer.propTypes = {
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

export default withRouter(connect(mapStateToProps)(AdminSettingsContainer));
