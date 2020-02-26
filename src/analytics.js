
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
// (ADDED by Curt just to keep linter quiet)

import ua from 'universal-analytics';
import {JSONStorage} from 'node-localstorage';
import electron from 'electron';
import username from 'username';
const {app} = electron;
const nodeStorage = new JSONStorage(app.getPath('userData'));

// Retrieve the userid value, and if it's not there, get it from the OS.
const userId = nodeStorage.getItem('userid') || username.sync();

// (re)save the userid, so it persists for the next app session.
nodeStorage.setItem('userid', userId);

const usr = ua('UA-158825541-1');

usr.set('uid', userId);

export default function trackEvent(category, action, label) {
  usr.
    event({
      ec: category,
      ea: action,
      el: label
    }).
    send();
}
