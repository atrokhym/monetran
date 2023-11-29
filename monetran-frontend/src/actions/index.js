import { sessionService } from 'redux-react-session';
import Cookies from 'js-cookie';
import { USER_ACTION_TYPES, APP_ACTION_TYPES } from './actionTypes';
import userService from '../services/userService';
import appService from '../services/appService';
import { COOKIE_NAME, setCookie } from '../utils/config';
import adminService from '../services/adminService';

export const error = msg => ({
  type: APP_ACTION_TYPES.ERROR,
  data: msg,
});

export const alert = msg => ({
  type: APP_ACTION_TYPES.ALERT,
  data: msg,
});

const signup = () => ({
  type: USER_ACTION_TYPES.SIGNUP,
});

const login = () => ({
  type: USER_ACTION_TYPES.LOGIN,
});

const signupSuccessful = () => ({
  type: USER_ACTION_TYPES.SIGNUP_SUCCESS,
});

const loginSuccessful = user => ({
  type: USER_ACTION_TYPES.LOGIN_SUCCESS,
  data: user,
});

const signupFailed = data => ({
  type: USER_ACTION_TYPES.SIGNUP_FAILED,
  data,
});

export const passwordConfirmFailed = () => ({
  type: USER_ACTION_TYPES.PASSWORD_CONFIRM_FAIL,
  data: 'Password does not match',
});
const loginFailed = ({ message }) => ({
  type: USER_ACTION_TYPES.LOGIN_FAILED,
  data: message,
});

const emailVerified = () => ({
  type: USER_ACTION_TYPES.EMAIL_VERIFIED,
  data: 'Email address verified successfully',
});

const p2ptransferComplete = message => ({
  type: USER_ACTION_TYPES.P2PTRANSFER_COMPLETE,
  data: message,
});

const achTransferRequestSent = message => ({
  type: USER_ACTION_TYPES.ACH_TRANSFER_SENT,
  data: message,
});

const kycDocApproved = message => ({
  type: USER_ACTION_TYPES.KYC_DOC_APPROVED,
  data: message,
});

const kycDocDeclined = message => ({
  type: USER_ACTION_TYPES.KYC_DOC_DECLINED,
  data: message,
});

const walletActivated = message => ({
  type: USER_ACTION_TYPES.WALLET_ACTIVATED,
  data: message,
});

export const clearFlashMessages = () => ({
  type: APP_ACTION_TYPES.CLEAR_FLASH_MESSAGES,
});

export const use2fa = () => ({
  type: USER_ACTION_TYPES.USE_2FA,
});

export const saveSession = async (dispatch, user, history, nologin) => {
  try {
    setCookie(COOKIE_NAME, user.access_token, 7);
    await sessionService.saveSession(user.access_token);
    await sessionService.saveUser(user);
    if (!nologin) {
      await dispatch(loginSuccessful(user));
    }
  } catch (err) {
    if (err) {
      dispatch(error(err.message));
    }
  }
};

// thunks
export const signupUser = data => async dispatch => {
  try {
    dispatch(signup());
    await userService.signup(data);
    dispatch(signupSuccessful());
  } catch (err) {
    if (err) {
      dispatch(signupFailed(err.message));
    }
  }
};

export const oAuthLogin = (provider, oauthUID) => async dispatch => {
  try {
    dispatch(login());
    const user = await userService.oAuthLogin(provider, oauthUID);
    saveSession(dispatch, user);
  } catch (err) {
    if (err) dispatch(loginFailed({ message: err.message, code: err.code }));
  }
};

export const loginUser = (email, password) => async dispatch => {
  try {
    await logoutUser();
    await dispatch(login());
    const user = await userService.login(email, password);
    if (user.use_2fa) {
      await userService.sendOTP(user.id);
      return dispatch(use2fa());
    }
    await saveSession(dispatch, user);
  } catch (err) {
    if (err) {
      dispatch(loginFailed({ message: err.message, code: err.code }));
    }
  }
};

export const saveSessionFromOTP = (user, history) => async dispatch => {
  try {
    saveSession(dispatch, user, history);
  } catch (err) {
    dispatch(loginFailed({ message: err.message }));
  }
};

export const changePassword = (
  password,
  passwordConfirmation,
  resetToken,
  currentPassword,
  source,
) => async dispatch => {
  try {
    const resp = await userService.changePassword({
      password,
      passwordConfirmation,
      resetToken,
      currentPassword,
      source,
    });
    dispatch(alert(resp.data.message));
  } catch (err) {
    dispatch(error(err.message));
  }
};
export const logoutUser = async () => {
  try {
    await sessionService.deleteUser();
    await sessionService.deleteSession();
    Cookies.remove(COOKIE_NAME);
    window.location.replace('#/login');
  } catch (err) {
    if (err) throw err;
  }
};

export const verifyEmail = ({ t }) => async dispatch => {
  try {
    await userService.verifyEmail(t);
    dispatch(emailVerified());
  } catch (err) {
    if (err) throw err;
  }
};

export const activateWallet = id => async dispatch => {
  try {
    const resp = await userService.activateWallet(id);
    dispatch(walletActivated(resp));
  } catch (err) {
    if (err) dispatch(error(err.message));
  }
};

export const updateProfile = data => async dispatch => {
  try {
    const user = await userService.updateProfile(data);
    //saveSession(dispatch, user, null, true);
    dispatch(alert('Profile updated successfully!'));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const refreshUserSession = user => async dispatch => {
  saveSession(dispatch, user, null, true);
};

export const updateProfileImage = data => async dispatch => {
  try {
    const resp = await userService.updateImageUrl(data.secure_url);
    const user = resp.data;
    const url = await appService.getObjectUrl(user.image_url);
    user.image_url = url;
    //saveSession(dispatch, resp.data, null, true);
    dispatch(alert(resp.message));
  } catch (err) {
    if (err) dispatch(error(err.message));
  }
};

export const uploadKYCDoc = (data, type) => async dispatch => {
  try {
    const resp = await userService.uploadKYCDoc(data.secure_url, type);
    //saveSession(dispatch, resp.data, null, true);
    dispatch(alert(resp.message));
  } catch (err) {
    if (err) dispatch(error(err.message));
  }
};

export const requestAnchorWithdrawal = req => async dispatch => {
  try {
    const resp = await userService.requestAnchorWithdrawal(req);
    dispatch(alert(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const transferRequest = req => async dispatch => {
  try {
    const resp = await userService.transferRequest(req);
    dispatch(alert(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const transferP2pRequest = req => async dispatch => {
  try {
    const resp = await userService.transferP2pRequest(req);
    dispatch(p2ptransferComplete(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const sendACHTransferRequest = req => async dispatch => {
  try {
    const resp = await userService.sendACHTransferRequest(req);
    dispatch(achTransferRequestSent(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const approveKYC = doc => async dispatch => {
  try {
    const resp = await adminService.approveKYC(doc);
    dispatch(kycDocApproved(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const declineKYC = (id, reason) => async dispatch => {
  try {
    const resp = await adminService.declineKYC(id, reason);
    dispatch(kycDocDeclined(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const achCreditUser = id => async dispatch => {
  try {
    await adminService.achCreditUser(id);
    dispatch(alert('User account has been credited with requested amount!'));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const declineAchRequest = (id, reason) => async dispatch => {
  try {
    await adminService.declineAchRequest(id, reason);
    dispatch(alert('ACH Request has been declined!'));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const approveWithdrawal = id => async dispatch => {
  try {
    await adminService.approveWithdrawal(id);
    dispatch(alert('Withdrawal request has been approved!'));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const declineWithdrawal = (id, reason) => async dispatch => {
  try {
    await adminService.declineWithdrawal(id, reason);
    dispatch(alert('Withdrawal request has been declined!'));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const updateSettings = data => async dispatch => {
  try {
    const resp = await adminService.updateSettings(data);
    dispatch(alert(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};

export const createAdmin = data => async dispatch => {
  try {
    const resp = await adminService.createAdmin(data);
    dispatch(alert(resp));
  } catch (err) {
    dispatch(error(err.message));
  }
};
