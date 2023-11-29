import { Service, ErrException } from '.';

class AppService extends Service {
  async overview() {
    const { req } = this.refreshToken();
    const data = {
      walletTransactions: {
        num_transfers: 0,
        total_funded_to_wallets: 0,
        transactions: [],
      },
      recentWalletTxts: [],
      wallet: {},
    };
    try {
      const totalTransfersResp = await req.get('/transfers/total');
      data.walletTransactions.num_transfers =
        totalTransfersResp.data.data.total_transfers;
      const totalFundedResp = await req.get('/wallets');
      data.walletTransactions.total_funded_to_wallets =
        totalFundedResp.data.data.total_funded;
      const walletTxts = await req.get('/wallets/transactions');
      data.walletTransactions.transactions = walletTxts.data.data;
      const recentWalletTxtData = await req.get('/wallets/transactions/recent');
      data.recentWalletTxts = recentWalletTxtData.data.data;
      const userWalletsResp = await req.get('/user/wallets');
      data.wallet = userWalletsResp.data.data;
      return data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async walletTransactions(page = 1) {
    const { req } = this.refreshToken();
    try {
      const data = await req.get(`/wallets/transactions?page=${page}`);
      return data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
  }
  async transactions() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/transfers');
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async withdrawals() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/withdrawals');
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async xlmToNgnt(amount) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/rates/toNgnt', {
        amount: parseFloat(amount),
        from: 'XLM',
      });
      return resp.data.amount;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  // TODO: remove hardcoded value
  async xlmPrice() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('https://api.stellarterm.com/v1/ticker.json');
      return resp.data.assets[0].price_USD;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async ngnPrice() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/rates/ngn');
      return resp.data.rate;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return 365;
  }

  async getCowrieData({ sort_code, account_number }) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get('/transfers/cowrie', {
        params: {
          sort_code,
          account_number,
        },
      });
      return resp.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async chargeMNDA({ token, amount }) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/ext/stripe/charge', {
        token,
        amount: parseFloat(amount),
        description: 'MNDA Purchase Charge',
      });
      return resp.data.status;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async generateACHRef(slug, amount) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get(
        `/wallet/${slug}/payment_ref?amount=${amount}`,
      );
      return resp.data.reference;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async configs(type) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.get(`/configs/${type}`);
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async getObjectUrl(filename) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/ext/gc/objecturl', { filename });
      return resp.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }
}

export default new AppService();
