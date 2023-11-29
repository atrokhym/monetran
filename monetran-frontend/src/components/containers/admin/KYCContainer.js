import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Modal from 'react-modal';
import * as qs from 'query-string';
import MainContent from '../../common/MainContent';
import Loader from '../../common/Loader';
import * as actions from '../../../actions';
import adminService from '../../../services/adminService';
import { viewGCSObject } from '../../../utils';

class KYCContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      docs: [],
      decline_reason: '',
      showModal: false,
      id: null,      
    };
    this.approveKYC = this.approveKYC.bind(this);
    this.declineKYC = this.declineKYC.bind(this);
  }

  renderLoading() {
    return <Loader />
  }

  async componentDidMount() {
    const { dispatch } = this.props;
    const query = qs.parse(this.props.location.search);
    if (Object.keys(query).length > 0) {
      switch (query.action) {
        case 'approve':
          dispatch(actions.approveKYC(query.doc));
          break;
        case 'decline':
          dispatch(actions.declineKYC(query.doc));
          break;
        default:
          break;
      }
    }
    try {
      const docs = await adminService.kycDocs();
      this.setState({ docs, isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ isLoading: false });
        return dispatch(actions.error(err.message));
      }
    }
    return null;
  }

  handleClose = () => {
    this.setState({ showModal: false });
  };

  handleShow = (e) => {
    //const { id } = this.state;
    this.setState({ id: e.target.id, showModal: true });    
  };


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
          <div className="py-h m-0 hd">
            <label htmlFor="decline_reason" className="m-0">State the reason for declining this upload</label>
            <br />
            <textarea
              name="decline_reason"
              value={this.state.decline_reason}
              onChange={e =>
                this.setState({ [e.target.name]: e.target.value })
              }
              rows={2}
              cols={30}
            />
          </div>
          <div className="grid-2-s">
            <button
              style={{ background: 'red' }}
              className="rad-s bg-primary co-white px-2 py-1 non-printable"
              onClick={this.declineKYC}
            >
              Decline
            </button>
            <button 
              className="rad-s bg-primary co-white px-2 py-1 non-printable"
              onClick={this.handleClose}
            >
              Close
            </button>
           </div>
        </Modal>
      </div>
    );
  };


  showDeclineInput(e) {
    e.preventDefault();
    //const actionsDiv = document.getElementById('actions');
    const declineInput = document.getElementById('declineInputKYC');
    declineInput.style.display = 'block';
    //actionsDiv.style.display = 'none';
  }

  approveKYC(e) {
    const { dispatch } = this.props;
    e.preventDefault();
    dispatch(actions.approveKYC(e.target.id));
    setTimeout(() => window.location.reload(), 3000);
  }

  declineKYC(e) {
    const { dispatch } = this.props;
    e.preventDefault();
    const { id, decline_reason } = this.state;
    this.setState({ isLoading: true });
    try {      
      dispatch(actions.declineKYC(id, decline_reason));
      this.setState({ showModal: false });
      this.setState({ isLoading: false });
    } catch (err) {
      if (err) {
        this.setState({ showModal: false });
        this.setState({ isLoading: false });
        this.props.dispatch(actions.error(err.message));
      }
    }
    setTimeout(() => window.location.reload(), 3000);
  }

  render() {
    const { isLoading, docs } = this.state;
    if (isLoading) return this.renderLoading();
    return (
      <MainContent {...this.props}>
        <section className="width-100-pc">
          <div className="maxwidth-sl mx-auto wrapper">
            <h4 className="mt-0">KYC Uploads</h4>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Upload Date</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (docs.length < 1) {
                      return (
                        <tr>
                          <td>No KYC data at this time.</td>
                        </tr>
                      );
                    }
                  })()}
                  {docs.map((data, i) => (
                    <tr key={i + 1}>
                      <td>{`${data.first_name} ${data.last_name}`}</td>
                      <td>{data.type.toUpperCase()}</td>
                      <td>{new Date(data.created_at).toDateString()}</td>
                      <td>
                        <a href={data.filename} id={data.filename} onClick={viewGCSObject} target="_blank" rel="noopener noreferrer">
                          view
                        </a>
                      </td>
                      <td style={{ display: (data.is_verified) ? 'none' : 'block' }}>
                        <button type="button" className="w-100 b-rad-s bg-primary co-white py-1" id={data.id} onClick={this.approveKYC}>Approve</button>
                      </td>
                      <td style={{ display: (data.is_verified) ? 'none' : '' }}>
                        <button style={{ background: 'red' }} 
                                type="button" 
                                className="w-100 b-rad-s bg-primary co-white py-1" 
                                id={data.id} 
                                onClick={this.handleShow}
                        >
                          Decline
                        </button>
                      </td>
{/*
                      <td style={{ display: (data.is_verified) ? 'none' : '' }}>
                        <div id="declineInputKYC" style={{ display: 'block' }}>
                              <input
                                type="text"
                                name="decline_reason"
                                value={this.state.decline_reason}
                                onChange={e =>
                                  this.setState({ [e.target.name]: e.target.value })
                                }
                              />
                        </div>
                      </td>
*/}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {this.showModalNotification()}
        </section>
      </MainContent>
    );
  }
}

/* eslint-disable */
KYCContainer.propTypes = {
  user: PropTypes.object,
  page: PropTypes.string,
  dispatch: PropTypes.func,
};

const mapStateToProps = (state) => {
  const {
    isFetching, error, alert,
  } = state.user || {};
  const {
    checked, authenticated, user,
  } = state.session || {};
  return {
    isFetching, checked, authenticated, user, error, alert,
  };
};

export default withRouter(connect(mapStateToProps)(KYCContainer));
