import { Service, ErrException } from '.';

class AdminService extends Service {
  async overview() {
    const { req } = this.refreshToken();
    try {
      // network requests
      const recentACHTransfersData = await req.get(
        '/admin/overview/ach_transfers',
      );
      const recentKYCUploadsData = await req.get('/admin/overview/kyc');
      const recentWithdrawalsData = await req.get(
        '/admin/overview/withdrawals',
      );

      const recentACHTransfers = recentACHTransfersData.data.data;
      const recentKYCUploads = recentKYCUploadsData.data.data;
      const recentWithdrawals = recentWithdrawalsData.data.data;
      return {
        recentACHTransfers,
        recentKYCUploads,
        recentWithdrawals,
        xlmBalance: 0,
        mndaBalance: 0,
      };
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async transfers() {
    const { req } = this.refreshToken();
    try {
      const transfersData = await req.get('/admin/transfers');
      return transfersData.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async kycDocs() {
    const { req } = this.refreshToken();
    try {
      const docsData = await req.get('/admin/kyc');
      return docsData.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async withdrawals() {
    const { req } = this.refreshToken();
    try {
      const data = await req.get('/admin/withdrawals');
      return data.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async getACHTransfer(id) {
    const { req } = this.refreshToken();
    try {
      const transferData = await req.get(`/admin/transfers/${id}`);
      return transferData.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async getWithdrawal(id) {
    const { req } = this.refreshToken();
    try {
      const data = await req.get(`/admin/withdrawals/${id}`);
      return data.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async getCharges() {
    const { req } = this.refreshToken();
    try {
      const data = await req.get('/admin/charges');
      return data.data.data;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async approveKYC(id) {
    const { req } = this.refreshToken();
    try {
      const kycResp = await req.post(`/admin/kyc/approve/${id}`, {});
      return kycResp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async declineKYC(id, reason) {
    const { req } = this.refreshToken();
    try {
      const kycResp = await req.post(`/admin/kyc/decline/${id}`, { reason });
      return kycResp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async achCreditUser(id) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post(`/admin/topup/ach/${id}`, {});
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async declineAchRequest(id, reason) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post(`/admin/ach/decline/${id}`, { reason });
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async approveWithdrawal(id) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post(`/admin/withdrawals/${id}/approve`, {});
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async declineWithdrawal(id, reason) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post(`/admin/withdrawals/${id}/decline`, {
        reason,
      });
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async updateSettings(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/admin/settings', data);
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async createAdmin(data) {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/admin', data);
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }

  async purgeTransfers() {
    const { req } = this.refreshToken();
    try {
      const resp = await req.post('/admin/transfers/purge', {});
      return resp.data.message;
    } catch (err) {
      if (err) throw new ErrException(err);
    }
    return null;
  }
}

export default new AdminService();
