const defaultStore = {
  user: {
    isFetching: false,
    isLoggedIn: false,
    isSignedUp: false,
    emailVerified: false,
    use2fa: false,
    invalidated: false,
    p2ptransferComplete: false,
    alert: '',
    error: null,
    firstname: '',
    lastname: '',
    email: '',
    phone_number: '',
    bank_info: {
      account_name: '',
      account_number: '',
      bank_name: '',
      sort_code: '',
    },
    wallets: [

    ],
    access_token: '',
  },
};

export default defaultStore;
