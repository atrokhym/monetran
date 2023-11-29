import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import MainContent from '../common/MainContent';
import Loader from '../common/Loader';
import * as actions from '../../actions';
import userService from '../../services/userService';

class AccountContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      firstname: '',
      lastname: '',
      email: '',
      image_url: '',
      bank_name: '',
      account_name: 'Checking',
      account_number: '',
      sort_code: '',
      bank_address: '',
      current_password: '',
      password: '',
      password_confirmation: '',
      checked: true,
      use_2fa: '',
      docs: [],
      showModal: false,
    };
    this.handleInput = this.handleInput.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
    this.imageUploadWidget = this.imageUploadWidget.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.kycUpload = this.kycUpload.bind(this);
    this.kycUploadGovt = this.kycUploadGovt.bind(this);
    this.kycUploadUtil = this.kycUploadUtil.bind(this);
    this.kycDocStatus = this.kycDocStatus.bind(this);
    this.kycDocStatusText = this.kycDocStatusText.bind(this);
    this.changePassword = this.changePassword.bind(this);    
  }

  async componentDidMount() {
    this.setState({ isLoading: true });
    const default_image_url = '/avatar.png';
    const user = await userService.getProfile();
    const docs = await userService.kycDocs();
    const image_url =
      user.image_url !== '' ? user.image_url : default_image_url;
    this.setState({
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      image_url,
      bank_name: user.bank_info.bank_name,
      account_name: user.bank_info.account_name ? user.bank_info.account_name : 'Checking',
      account_number: user.bank_info.account_number,
      sort_code: user.bank_info.sort_code,
      bank_address: user.bank_info.bank_address,
      use_2fa: user.use_2fa.toString(),
      docs,
      isLoading: false,
      checked: user.use_2fa === true ? true : false,
    });
  }

  async updateProfile000(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const data = {};
    Object.assign(data, this.state);
    if (data.bank_name !== '') {
      data.bank_info = 'set';
    }
    delete data.docs;
    delete data.isLoading;
    delete data.checked;
    delete data.showModal;
    this.props.dispatch(actions.updateProfile(data));
    this.handleShow();
    this.setState({ isLoading: false });
  }

  async updateProfile(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const data = {};
    Object.assign(data, this.state);
    if (data.bank_name !== '') {
      data.bank_info = 'set';
    }
    delete data.docs;
    delete data.isLoading;
    delete data.checked;
    delete data.showModal;
    this.props.dispatch(actions.updateProfile(data));
    this.handleShow();
    this.setState({ isLoading: false });
  }

  async imageUploadWidget(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    const fileObj = document.getElementById('profile_image_file');
    const image = fileObj.files[0];
    // validate image type
    if (!this.isValidImageExtension(image.type)) {
      this.props.dispatch(
        actions.error('Invalid image type select, please check file'),
      );
      this.setState({ isLoading: false });
      return;
    }
    const uploadObj = new FormData();
    uploadObj.append('image', image);
    const imageUrl = await userService.uploadImage(uploadObj);
    this.props.dispatch(actions.updateProfileImage({ secure_url: imageUrl }));
    this.setState({ isLoading: false });
  }

  isValidImageExtension = type => {
    let regex = new RegExp('(.*?).(jpg|jpeg|png)$');
    return regex.test(type);
  };

  async kycUpload(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    try {
      let uploadObj;
      const govtDoc = document.getElementById('file_govt_id').files;
      const utilDoc = document.getElementById('file_util_doc').files;
      if (govtDoc && govtDoc.length > 0) {
        uploadObj = new FormData();
        uploadObj.append('image', govtDoc[0]);
        const imageUrl = await userService.uploadImage(uploadObj);
        this.props.dispatch(
          actions.uploadKYCDoc({ secure_url: imageUrl }, 'govtid'),
        );
        //this.handleShow();
      }
      if (utilDoc && utilDoc.length > 0) {
        uploadObj = new FormData();
        uploadObj.append('image', utilDoc[0]);
        const imageUrl = await userService.uploadImage(uploadObj);
        this.props.dispatch(
          actions.uploadKYCDoc({ secure_url: imageUrl }, 'utilityBill'),
        );
      }

      if (uploadObj) {
        this.handleShow();
        setTimeout(() => window.location.reload(), 3000);
      }
      this.setState({ isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
  }


  async kycUploadGovt(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    try {
      let uploadObj;
      const govtDoc = document.getElementById('file_govt_id').files;
      //const utilDoc = document.getElementById('file_util_doc').files;
      if (govtDoc && govtDoc.length > 0) {
        uploadObj = new FormData();
        uploadObj.append('image', govtDoc[0]);
        const imageUrl = await userService.uploadImage(uploadObj);
        this.props.dispatch(
          actions.uploadKYCDoc({ secure_url: imageUrl }, 'govtid'),
        );
        this.handleShow();
      }
/*
      else if (utilDoc && utilDoc.length > 0) {
        uploadObj = new FormData();
        uploadObj.append('image', utilDoc[0]);
        const imageUrl = await userService.uploadImage(uploadObj);
        this.props.dispatch(
          actions.uploadKYCDoc({ secure_url: imageUrl }, 'utilityBill'),
        );
        this.handleShow();
      }
*/
      this.setState({ isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
  }


  async kycUploadUtil(e) {
    e.preventDefault();
    this.setState({ isLoading: true });
    try {
      let uploadObj;
      //const govtDoc = document.getElementById('file_govt_id').files;
      const utilDoc = document.getElementById('file_util_doc').files;
/*
      if (govtDoc && govtDoc.length > 0) {
        uploadObj = new FormData();
        uploadObj.append('image', govtDoc[0]);
        const imageUrl = await userService.uploadImage(uploadObj);
        this.props.dispatch(
          actions.uploadKYCDoc({ secure_url: imageUrl }, 'govtid'),
        );
        this.handleShow();
      }
      else 
*/
      if (utilDoc && utilDoc.length > 0) {
        uploadObj = new FormData();
        uploadObj.append('image', utilDoc[0]);
        const imageUrl = await userService.uploadImage(uploadObj);
        this.props.dispatch(
          actions.uploadKYCDoc({ secure_url: imageUrl }, 'utilityBill'),
        );
        this.handleShow();
      }
      this.setState({ isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
  }


  kycDocStatus = (type) => {
    const { docs } = this.state;    
    let status = -1;
    for (let v of docs) {
        if (v.type !== type) continue;
    //docs.filter(v => v.type !== type).forEach(v => {     
        status = v.status;
    };
    return status;
  }


  kycDocStatusText = (status) => {
    switch(status) {
      case -1:
        return "";
      case 0:
        return "Pending";
      case 1:
        return "Approved";
      case 2:
        return "Declined";
    }
  }


  changePassword(e) {
    e.preventDefault();
    const { current_password, password, password_confirmation } = this.state;
    if (password !== password_confirmation) {
      this.props.dispatch(actions.passwordConfirmFailed());
    }
    this.props.dispatch(
      actions.changePassword(
        password,
        password_confirmation,
        null,
        current_password,
        this.state.email,
      ),
    );
    this.setState({
      password: '',
      current_password: '',
      password_confirmation: '',
    });
    setTimeout(() => window.location.reload(), 60000);
  }

  handleInput(e) {
    e.preventDefault();
    this.setState({ [e.target.name]: e.target.value });
  }

  handleCheck(e) {
    this.setState({
      checked: !this.state.checked,
      use_2fa: (!this.state.checked).toString(),
    });
  }

  handleClose = () => {
    this.setState({ showModal: false });
  };

  handleShow = () => {
    this.setState({ showModal: true });
  };

  renderFlashMessage() {
    const { error, alert } = this.props || this.props.location;
    if (error) {
      return <div className="error-msg">{error}</div>;
    }
    if (alert) {
      return <div className="success-msg">{alert}</div>;
    }
    return null;
  }

  showModalNotification = () => {
    const customStyles = {
      content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
      },
    };
    Modal.setAppElement('#root');
    return (
      <div>
        <Modal
          isOpen={this.state.showModal}
          contentLabel="Minimal Modal"
          style={customStyles}
        >
          {this.renderFlashMessage()}
          <br />
          <button onClick={this.handleClose}>Close</button>
        </Modal>
      </div>
    );
  };

  render() {
    const { user, page } = this.props;
    const { isLoading, docs } = this.state;    
    if (isLoading) return <Loader />;
    return (
      <MainContent user={user} page={page}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">My Account</h4>
            <div className="grid-1-2 my-2">
              <div className="mb-2">
                <div className="rad-s bg-white p-1 cardshadow">
                  <form onSubmit={this.imageUploadWidget}>
                    <div className="d-flx j-c-c">
                      <div className="rad-c p-h bg-white bottomshadow ">
                        <img
                          src={this.state.image_url}
                          className="big-avatar rad-c"
                          alt=""
                        />
                      </div>
                    </div>
                    <div className="py-1">
                      <div>
                        <h5>Update Profile Photo</h5>
                        <input type="file" id="profile_image_file" min="1" />
                        <div>
{/*
                            type="button"
                            onClick={this.imageUploadWidget}
*/}
                          <button
                            type="submit"
                            className="rad-s bg-primary co-white w-100 py-1"
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                  <hr />
                  <div>
                    <p>
                      Federation Address: <b>{user.federation_address}</b>
                    </p>
                  </div>
                </div>
              </div>

              <div className="">
                <div className="rad-s bg-white p-1 cardshadow">
                  <h4>Edit Profile</h4>
                  <form>
                    <div className="grid-2-s">
                      <div className="py-h">
                        <label htmlFor="firstname" className="m-0">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstname"
                          value={this.state.firstname}
                          onChange={this.handleInput}
                        />
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="lastname">Last Name</label>
                        <input
                          type="text"
                          name="lastname"
                          value={this.state.lastname}
                          onChange={this.handleInput}
                        />
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="bank_name">Bank Name</label>
                        <input
                          type="text"
                          name="bank_name"
                          value={this.state.bank_name}
                          onChange={this.handleInput}
                        />
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="account_name">Account Type</label>
{/*
                        <input
                          type="text"
                          name="account_name"
                          value={this.state.account_name}
                          onChange={this.handleInput}
                        />
*/}
                        <select 
                          type="text"
                          name="account_name"
                          value={this.state.account_name} 
                          onChange={this.handleInput}
                        >
                          <option value="Checking">Checking</option>
                          <option value="Saving">Saving</option>
                        </select>
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="account_number">Account Number</label>
                        <input
                          type="text"
                          name="account_number"
                          value={this.state.account_number}
                          onChange={this.handleInput}
                        />
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="bank_address">Bank Address</label>
                        <input
                          type="text"
                          name="bank_address"
                          value={this.state.bank_address}
                          onChange={this.handleInput}
                        />
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="sort_code">
                          Routing Number/Swift Code
                        </label>
                        <input
                          type="text"
                          name="sort_code"
                          value={this.state.sort_code}
                          onChange={this.handleInput}
                        />
                      </div>
                      <div className="py-h m-0">
                        <label htmlFor="use_2fa">Enable 2FA</label>
                        <input
                          type="checkbox"
                          defaultChecked={this.state.checked}
                          onChange={this.handleCheck}
                        />
                      </div>
                    </div>
                    <div className="py-1">
                      <div className="d-flx j-c-c py-h">
                        <button
                          type="button"
                          className="rad-s bg-primary co-white px-2 py-1"
                          onClick={this.updateProfile}
                        >
                          Update Profile
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="">
                    <div className="rad-s bg-white p-1 cardshadow">
                      <h4>Change Password</h4>
                      <form>
                        <div className="grid-2-s">
                          <div className="py-h">
                            <label htmlFor="firstname" className="m-0">
                              Current Password
                            </label>
                            <input
                              type="password"
                              name="current_password"
                              onChange={this.handleInput}
                            />
                          </div>
                          <div className="py-h">
                            <label htmlFor="firstname" className="m-0">
                              New Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              onChange={this.handleInput}
                            />
                          </div>
                          <div className="py-h">
                            <label htmlFor="firstname" className="m-0">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              name="password_confirmation"
                              onChange={this.handleInput}
                            />
                          </div>
                        </div>
                        <div className="py-1">
                          <div className="d-flx j-c-c py-h">
                            <button
                              type="button"
                              className="rad-s bg-primary co-white px-2 py-1"
                              onClick={this.changePassword}
                            >
                              Change Password
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  {(() => {
                    if (!user.kyc_verified) {
                      return (
                        <div className="">
                          <div className="rad-s bg-white p-1 cardshadow">
                            <h4>KYC Upload</h4>
                            <div>
                              <p>
                                Please upload a copy of a Government Issued ID
                                and Utility Bill
                              </p>

                              <div className="grid-2-s">
                                <div>
                                  <input 
                                    type="file" 
                                    min="1" 
                                    id="file_govt_id" 
                                    disabled = {(this.kycDocStatus('govtid') === 0 || this.kycDocStatus('govtid') === 1)? "disabled" : ""}
                                    />
                                  <p>
                                    Status: {this.kycDocStatusText(this.kycDocStatus('govtid'))}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="rad-s bg-primary co-white px-2 py-1"                                
                                  onClick={this.kycUpload}
                                >
                                  Upload Government ID
                                </button>
                              </div>
                              &nbsp;
                              <div className="grid-2-s">
                                <div>
                                  <input 
                                    type="file" 
                                    min="1" 
                                    id="file_util_doc" 
                                    disabled = {(this.kycDocStatus('utilityBill') === 0 || this.kycDocStatus('utilityBill') === 1)? "disabled" : ""}
                                    />
                                  <p>
                                    Status: {this.kycDocStatusText(this.kycDocStatus('utilityBill'))}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  name="utilityBill"
                                  className="rad-s bg-primary co-white px-2 py-1"                                
                                  onClick={this.kycUpload}
                                >
                                  Upload Utility Bill
                                </button>
                              </div>                              
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
          {this.showModalNotification()}
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
AccountContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
};

const mapStateToProps = state => {
  const { error, alert } = state.user || {};
  return {
    error,
    alert,
  };
};
export default connect(mapStateToProps)(AccountContainer);
