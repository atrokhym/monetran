import dotenv from 'dotenv';
import Cookies from 'js-cookie';

dotenv.load();

/* eslint-disable */
export const ENV =
  process.env.REACT_APP_ENV == undefined ? 'dev' : process.env.REACT_APP_ENV;
export const COOKIE_NAME = 'monetrancks';
export const BASE_URL = `${
  Object.is(process.env.REACT_APP_API_BASE_URL, undefined)
    ? 'api/v1'
    : process.env.REACT_APP_API_BASE_URL + '/api/v1'
}`;
//export const BASE_URL = 'https://sandbox-app.monetran.com/api/v1'
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_API_CLIENT_ID;
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
export const GOOGLE_STORAGE_BUCKET_NAME =
  process.env.REACT_APP_GOOGLE_STORAGE_BUCKET_NAME;
export const CLOUDINARY_CLOUD_NAME = 'monetran';
export const BUGSNAG_API_KEY = process.env.REACT_APP_BUGSNAG_API_KEY;
export const LOGOUT_INTERVAL = Object.is(
  process.env.REACT_APP_LOGOUT_INTERVAL,
  undefined,
)
  ? 10
  : process.env.REACT_APP_LOGOUT_INTERVAL;

export const setCookie = (name, value, exDays, domain, path) => {
  if (!domain) domain = window.location.hostname;
  if (!path) path = '/';

  Cookies.set(name, value, { path, domain, expires: exDays, sameSite: 'lax' });
};

export const getCookie = (name = null) => {
  if (name != null) {
    return Cookies.get(name);
  }
  return Cookies.get(COOKIE_NAME);
};

console.log('Base-Url: ' + BASE_URL);
