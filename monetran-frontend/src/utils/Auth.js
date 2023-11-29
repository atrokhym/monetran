import React from 'react';
import { connect } from 'react-redux';
import Cookies from 'js-cookie';
import { sessionService } from 'redux-react-session';
import * as _ from 'lodash';
import { COOKIE_NAME } from './config';
import Loader from '../components/common/Loader';

const useAuthenticatedUser = (Component) => {
  const mapStateToProps = ({ session }) => ({
    sessionUser: session.user,
  });
  return connect(mapStateToProps)(class extends React.Component {
    /* eslint class-methods-use-this: ["error", { "exceptMethods": ["logout"] }] */
    constructor(props) {
      super(props);
      this.state = {
        user: {},
        isAuth: false,
      };
    }

    async componentDidMount() {
      const cookie = Cookies.get(COOKIE_NAME);
      if (cookie !== undefined) {
        try {
          const user = await sessionService.loadUser();
          if (user.access_token === cookie) {
            this.setUser(user);
          } else {
            this.logout();
          }
        } catch (err) {
          if (err) {
            this.logout();
          }
        }
      } else {
        this.logout();
      }
    }

    componentDidUpdate() {
      const { sessionUser } = this.props;
      const { user } = this.state;
      if (!_.isEmpty(sessionUser) && sessionUser !== user) {
        this.setUser(sessionUser);
      }
    }

    setUser(user) {
      this.setState({ user, isAuth: true });
    }

    logout() {
      window.location.replace('#/logout');
    }

    render() {
      const { user, isAuth } = this.state;
      return isAuth ? <Component user={user} {...this.props} /> : <Loader />;
    }
  });
};

export default useAuthenticatedUser;
