import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { logoutUser } from '../actions';
import Loader from './common/Loader';

import { Plugins } from '@capacitor/core';
import "@codetrix-studio/capacitor-google-auth";


const Logout = () => {
  logoutUser();
  return (
    <main>
      <Loader />
    </main>
  );
};

const mapDispatch = dispatch => ({
  logout: () => {
    dispatch(logoutUser());
  },
});

export default withRouter(connect(null, mapDispatch)(Logout));
