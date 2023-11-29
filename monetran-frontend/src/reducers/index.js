import Immutable from 'seamless-immutable';
import { USER_ACTION_TYPES, APP_ACTION_TYPES } from '../actions/actionTypes';

const initialState = Immutable({
  isLoggedIn: false,
  isFetching: false,
  isSignedUp: false,
  use2fa: false,
  emailVerifiedSuccessful: false,
  alert: '',
  error: null,
  p2ptransferComplete: false,
});

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case USER_ACTION_TYPES.LOGIN:
    case USER_ACTION_TYPES.SIGNUP:
      return Immutable(state).merge({
        isFetching: true,
      });
    case USER_ACTION_TYPES.LOGIN_FAILED:
    case USER_ACTION_TYPES.SIGNUP_FAILED:
    case USER_ACTION_TYPES.PASSWORD_CONFIRM_FAIL:
      return Immutable(state).merge({
        isFetching: false,
        error: action.data,
      });
    case USER_ACTION_TYPES.LOGIN_SUCCESS:
      return Immutable(state).merge({
        isFetching: false,
        isLoggedIn: true,
        error: null,
        use2fa: false,
        alert: 'Login successful',
      });
    case USER_ACTION_TYPES.SIGNUP_SUCCESS:
      return Immutable(state).merge({
        isFetching: false,
        isLoggedIn: false,
        isSignedUp: true,
        error: null,
        use2fa: false,
        alert: 'Signup successful',
      });
    case USER_ACTION_TYPES.USE_2FA:
      return Immutable(state).merge({
        isFetching: false,
        use2fa: true,
      });
    case USER_ACTION_TYPES.EMAIL_VERIFIED:
      return Immutable(state).merge({
        isFetching: false,
        emailVerifiedSuccessful: true,
        alert: action.data,
      });
    case USER_ACTION_TYPES.WALLET_ACTIVATED:
      return Immutable(state).merge({
        alert: action.data,
      });
    case APP_ACTION_TYPES.CLEAR_FLASH_MESSAGES:
      return Immutable(state).merge({
        alert: '',
        error: '',
      });
    case APP_ACTION_TYPES.ERROR:
      return Immutable(state).merge({
        isFetching: false,
        error: action.data,
        alert: null,
      });
    case APP_ACTION_TYPES.ALERT:
      return Immutable(state).merge({
        isFetching: false,
        alert: action.data,
        error: null,
      });
    case USER_ACTION_TYPES.P2PTRANSFER_COMPLETE:
      return Immutable(state).merge({
        p2ptransferComplete: true,
        alert: action.data,
        error: null,
      });
    case USER_ACTION_TYPES.ACH_TRANSFER_SENT:
    case USER_ACTION_TYPES.KYC_DOC_APPROVED:
    case USER_ACTION_TYPES.KYC_DOC_DECLINED:
      return Immutable(state).merge({
        isFetching: false,
        alert: action.data,
        error: null,
      });
    default:
      return state;
  }
}
