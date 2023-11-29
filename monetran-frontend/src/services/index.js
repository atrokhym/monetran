import axios from 'axios';
import { BASE_URL, getCookie } from '../utils/config';
// import bugsnag from '@bugsnag/js'
// import bugsnagReact from '@bugsnag/plugin-react'
// import { BUGSNAG_API_KEY } from '../utils/config';

// const bugsnagClient = new bugsnag(BUGSNAG_API_KEY);
// bugsnagClient.use(bugsnagReact, React);

export function ErrException(e) {
  if (!e.response) {
    e = {
      response: {
        status: 0,
        statusText: 'Unknown Error',
        data: { message: 'An Error Occurred' },
      },
    }; // eslint-disable-line
  }
  this.code = e.response.status;
  this.message = e.response.data.message || e.response.statusText;
  if (this.code >= 403) {
    window.location.replace('#/logout');
  } else {
    // bugsnagClient.notify(new Error(this.message));
  }
}
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["refreshToken"] }] */
export class Service {
  constructor(token, contentType) {
    this.data = {};
    this.token = token !== undefined ? token : getCookie();
    this.contentType =
      contentType !== undefined ? contentType : 'application/json';

    //axios.defaults.withCredentials = true;

    this.req = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': this.contentType,
        Authorization: `Bearer ${this.token}`,
      },
    });
    console.log('Base-Url: ' + BASE_URL);
  }

  refreshToken(contentType = '') {
    if (!this.token) {
      const token = getCookie();
      if (contentType !== '') return new Service(token, contentType);
      return new Service(token);
    }
    if (contentType !== '') this.contentType = contentType;
    return this;
  }
}
