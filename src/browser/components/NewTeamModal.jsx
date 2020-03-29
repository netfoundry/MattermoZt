// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import path from 'path';
import electron from 'electron';
import PropTypes from 'prop-types';
import {Modal, Button, FormGroup, FormControl, ControlLabel, HelpBlock, Image} from 'react-bootstrap';
import {remote} from 'electron';

const assetsDir = path.resolve(remote.app.getAppPath(), 'assets');

import Utils from '../../utils/util';

export default class NewTeamModal extends React.Component {
  static defaultProps = {
    restoreFocus: true,
  };

  constructor(props) {
    super(props);

    this.wasShown = false;
    this.state = {
      teamName: 'MattermoZt',
      teamUrl: 'https://mattermost.ziti.netfoundry.io',
      teamIdentity: '',
      teamOrder: props.currentOrder || 0,
      saveStarted: false,
    };
  }

  initializeOnShow() {
    this.setState({
      teamName: this.props.team ? this.props.team.name : 'MattermoZt',
      teamUrl: this.props.team ? this.props.team.url : 'https://mattermost.ziti.netfoundry.io',
      teamIdentity: this.props.team ? this.props.team.identity : '',
      teamIndex: this.props.team ? this.props.team.index : false,
      teamOrder: this.props.team ? this.props.team.order : (this.props.currentOrder || 0),
      saveStarted: false,
    });
  }

  getTeamNameValidationError() {
    if (!this.state.saveStarted) {
      return null;
    }
    return this.state.teamName.length > 0 ? null : 'Name is required.';
  }

  getTeamNameValidationState() {
    return this.getTeamNameValidationError() === null ? null : 'error';
  }

  handleTeamNameChange = (e) => {
    this.setState({
      teamName: e.target.value,
    });
  }

  getTeamUrlValidationError() {
    if (!this.state.saveStarted) {
      return null;
    }
    if (this.state.teamUrl.length === 0) {
      return 'URL is required.';
    }
    if (!(/^https?:\/\/.*/).test(this.state.teamUrl.trim())) {
      return 'URL should start with http:// or https://.';
    }
    if (!Utils.isValidURL(this.state.teamUrl.trim())) {
      return 'URL is not formatted correctly.';
    }
    return null;
  }

  getTeamUrlValidationState() {
    return this.getTeamUrlValidationError() === null ? null : 'error';
  }

  handleTeamUrlChange = (e) => {
    this.setState({
      teamUrl: e.target.value,
    });
  }

  getTeamIdentityValidationError() {
    if (!this.state.saveStarted) {
      return null;
    }
    return this.state.teamIdentity.length > 0 ? null : 'enrollment-token is required.';
  }

  getTeamIdentityValidationState() {
    return this.getTeamIdentityValidationError() === null ? null : 'error';
  }

  handleTeamIdentityChange = (e) => {
    this.setState({
      teamIdentity: e.target.value,
    });
  }

  getError() {
    const nameError = this.getTeamNameValidationError();
    const urlError = this.getTeamUrlValidationError();
    const identityError = this.getTeamIdentityValidationError();

    if (nameError && urlError && identityError) {
      return 'Name and URL and Identity are required.';
    } else if (nameError) {
      return nameError;
    } else if (urlError) {
      return urlError;
    } else if (identityError) {
      return identityError;
    }
    return null;
  }

  validateForm() {
    return this.getTeamNameValidationState() === null &&
      this.getTeamIdentityValidationState() === null &&
      this.getTeamUrlValidationState() === null;
  }

  save = () => {
    this.setState({
      saveStarted: true,
    }, () => {
      if (this.validateForm()) {
        this.props.onSave({
          url: this.state.teamUrl,
          identity: this.state.teamIdentity,
          name: this.state.teamName,
          index: this.state.teamIndex,
          order: this.state.teamOrder,
        });
      }
    });
  }

  getSaveButtonLabel() {
    if (this.props.editMode) {
      return 'Save';
    }
    return 'Add';
  }

  getModalTitle() {
    if (this.props.editMode) {
      return 'Edit Server';
    }
    return 'Add Server';
  }

  render() {
    if (this.wasShown !== this.props.show && this.props.show) {
      this.initializeOnShow();
    }
    this.wasShown = this.props.show;

    return (
      <Modal
        bsClass='modal'
        className='NewTeamModal'
        show={this.props.show}
        id='newServerModal'
        onHide={this.props.onClose}
        container={this.props.modalContainer}
        restoreFocus={this.props.restoreFocus}
        onKeyDown={(e) => {
          switch (e.key) {
          case 'Enter':
            this.save();

            // The add button from behind this might still be focused
            e.preventDefault();
            e.stopPropagation();
            break;
          case 'Escape':
            this.props.onClose();
            break;
          }
        }}
      >
        <Modal.Header>
          <Modal.Title>{this.getModalTitle()}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form>
            <FormGroup
              validationState={this.getTeamUrlValidationState()}
            >
              <ControlLabel>{'Ziti enrollment-token file'}</ControlLabel>
              <div className='InputRow'>
                <Image src={path.join(assetsDir, 'ziti-man.png')} width='40px' />
                <FormControl
                  id='teamIdentityInput'
                  type='text'
                  value={this.state.teamIdentity}
                  placeholder='e.g. /Users/you/you.jwt'
                  onChange={this.handleTeamIdentityChange}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
                <Image src={path.join(assetsDir, 'ziti-logo.png')} width='35px' />
              </div>
              <FormControl.Feedback/>
              <HelpBlock className='NewTeamModal-noBottomSpace'>{'Enter the absolute PATH to your Ziti enrollment-token file.'}</HelpBlock>
              <br/>
              <br/>
            </FormGroup>

            <FormGroup
              validationState={this.getTeamNameValidationState()}
            >
              <ControlLabel>{'Server Display Name (you do not need to change this)'}</ControlLabel>
              <FormControl
                id='teamNameInput'
                type='text'
                value={this.state.teamName}
                placeholder='Server Name'
                onChange={this.handleTeamNameChange}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                autoFocus={true}
              />
              <FormControl.Feedback/>
              <HelpBlock>{'The name of the server displayed on your desktop app tab bar.'}</HelpBlock>
            </FormGroup>

            <FormGroup
              className='NewTeamModal-noBottomSpace'
              validationState={this.getTeamUrlValidationState()}
            >
              <ControlLabel>{'Server URL (you SHOULD NOT change this)'}</ControlLabel>
              <FormControl
                disabled={true}
                id='teamUrlInput'
                type='text'
                value={this.state.teamUrl}
                placeholder='https://example.com'
                onChange={this.handleTeamUrlChange}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
              <FormControl.Feedback/>
              <HelpBlock>{'The URL of the MattermoZt server. Must start with http:// or https://.'}</HelpBlock>
            </FormGroup>

          </form>
        </Modal.Body>

        <Modal.Footer>
          <div
            className='pull-left modal-error'
          >
            {this.getError()}
          </div>

          <Button
            id='cancelNewServerModal'
            onClick={this.props.onClose}
          >{'Cancel'}</Button>
          <Button
            id='saveNewServerModal'
            onClick={this.save}
            disabled={!this.validateForm()}
            bsStyle='primary'
          >{this.getSaveButtonLabel()}</Button>
        </Modal.Footer>

      </Modal>
    );
  }
}

NewTeamModal.propTypes = {
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  team: PropTypes.object,
  editMode: PropTypes.bool,
  show: PropTypes.bool,
  modalContainer: PropTypes.object,
  restoreFocus: PropTypes.bool,
  currentOrder: PropTypes.number,
};
