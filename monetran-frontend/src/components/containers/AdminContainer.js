import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import MainContent from '../common/MainContent';
import Loader from '../common/Loader';


class AdminContainer extends Component {
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
            <p>
              Welcome back,
              {` ${user.firstname}`}
            </p>
            <h4 className="mt-0">Dashboard</h4>
          </div>
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
AdminContainer.propTypes = {
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

export default withRouter(connect(mapStateToProps)(AdminContainer));
