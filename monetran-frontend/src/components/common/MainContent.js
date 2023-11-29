import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';

const MainContent = props => {
  const { user, page } = props;
  return (
    <div>
      <Header
        is_admin={user.is_admin}
        firstname={user.firstname}
        image_url={user.image_url || '/avatar.png'}
        lastname={user.lastname}
        page={page}
      />
      <main className="header-margin">
        {/* eslint-disable */}
        {props.children}
      </main>
    </div>
  );
};

MainContent.propTypes = {
  user: PropTypes.shape({
    firstname: PropTypes.string,
    lastname: PropTypes.string,
  }),
  page: PropTypes.string,
};
export default MainContent;
