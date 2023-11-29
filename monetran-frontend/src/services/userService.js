import { Service, ErrException } from '.';


class UserService extends Service {
  async signup(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/auth/signup', data);
      return resp.data.data;
    } catch (err) {
      if (err) {
        throw new ErrException(err);
      }
    }
    return null;
  }

  async oAuthLogin(provider, oauthUID) {
    const { req } = this.refreshToken();
    try {
      const data = {
        with_oauth: true,
        oauth_provider: provider,
        oauth_uid: oauthUID,
      };
      const resp = await req.post('/auth', data);
      return resp.data.data.user;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async login(email, password) {
    const { req } = this.refreshToken();
    try {
      const data = {
        email,
        password,
      };
      const resp = await req.post('/auth', data);
      return resp.data.data.user;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async sendOTP(id) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get(`/auth/otp/${id}`);
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async verifyOTP(email, code) {
    const { req } = this.refreshToken();
    try {
      const data = { email, code };
      const resp = await req.post('/auth/otp', data);
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async verifyEmail(token) {
    const { req } = this.refreshToken();
    try {
      return await req.post('/auth/verifyemail', { token });
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async resetPassword(email) {
    const { req } = this.refreshToken();
    try {
      return await req.post('/auth/passwordreset', { email });
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async changePassword(data) {
    const { req } = this.refreshToken();
    try {
      return await req.post('/auth/account/password/reset', data);
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async activateWallet(id) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/wallets/activate', { wallet_id: id });
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async getProfile() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/user/profile');
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async getBankDetails(id) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get(`/users/${id}/objects/bank`);
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async updateProfile(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/user/profile', data);
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async uploadImage(data) {
    //const { req } = this.refreshToken('multipart/form-data');
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/user/profile/upload', data);
      return resp.data.data.image_url;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async updateImageUrl(url) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/user/profile/image', { url });
      return resp.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async kycDocs() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/user/profile/trustdocs');
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async uploadKYCDoc(url, type) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/user/profile/kyc', { url, type });
      return resp.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async wallets() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/user/wallets');
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async requestAnchorWithdrawal(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/withdrawals', data);
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async transferRequest(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/transfers', data);
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async transferP2pRequest(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/transfers/p2p', data);
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async sendACHTransferRequest(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/wallets/ach_transfers/save_request', data);
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async achTransfers(page = 1) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get(`/wallets/ach_transfers?page=${page}`);
      return resp.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async p2pTransferHistory() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/transfers/p2p');
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }
}

export default new UserService();
