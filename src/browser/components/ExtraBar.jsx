// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import {Row, Button} from 'react-bootstrap';

export default class ExtraBar extends React.Component {
  handleBack = () => {
    if (this.props.mattermostView) {
      this.props.mattermostView.goBack();
    }
  }
  render() {
    let barClass = 'clear-mode';
    if (!this.props.show) {
      barClass = 'hidden';
    } else if (this.props.darkMode) {
      barClass = 'dark-mode';
    }

    return (
      <Row
        id={'extra-bar'}
        className={barClass}
      >
        <div
          className={'container-fluid'}
          onClick={this.handleBack}
        >
          <span
            id={'back_button_icon'}
            className={'backIcon fa fa-1x fa-angle-left'}
            title={'Back Icon'}
          />
          <Button
            className={'backLabel'}
            bsStyle={'link'}
            bsSize={'xsmall'}
          >{'Back'}</Button>
        </div>
      </Row>
    );
  }
}

ExtraBar.propTypes = {
  darkMode: PropTypes.bool,
  mattermostView: PropTypes.object,
  show: PropTypes.bool,
};