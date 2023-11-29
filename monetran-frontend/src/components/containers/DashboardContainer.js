import React from 'react';
import { withRouter } from 'react-router-dom';
import Routes from '../../routes';

/* eslint-disable*/
const DashboardContainer = (props) => {
  const { user } = props;
  return (
    <Routes useAuth user={user} />
  );
};

export default withRouter((DashboardContainer));
