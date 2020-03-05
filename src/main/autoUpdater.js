// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import path from 'path';

import {app, BrowserWindow, dialog, ipcMain, shell} from 'electron';
import isDev from 'electron-is-dev';
import logger from 'electron-log';
import {autoUpdater, CancellationToken} from 'electron-updater';
import semver from 'semver';

// eslint-disable-next-line no-magic-numbers
const UPDATER_INTERVAL_IN_MS = 2 * 60 * 60 * 1000; // 2 hours

autoUpdater.logger = logger;
autoUpdater.logger.transports.file.level = 'debug';

let updaterModal = null;

function createEventListener(win, eventName) {
  return (event) => {
    if (event.sender === win.webContents) {
      win.emit(eventName);
    }
  };
}

function createUpdaterModal(parentWindow, options) {
  const windowWidth = 480;
  const windowHeight = 280;
  const windowOptions = {
    title: `${app.getName()} Updater`,
    parent: parentWindow,
    modal: true,
    maximizable: false,
    show: false,
    width: windowWidth,
    height: windowHeight,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#fff', // prevents blurry text: https://electronjs.org/docs/faq#the-font-looks-blurry-what-is-this-and-what-can-i-do
  };
  if (process.platform === 'linux') {
    windowOptions.icon = options.linuxAppIcon;
  }

  const modal = new BrowserWindow(windowOptions);
  modal.once('ready-to-show', () => {
    modal.show();
  });
  let updaterURL = (global.isDev ? 'http://localhost:8080' : `file://${app.getAppPath()}`) + '/browser/updater.html';

  if (options.notifyOnly) {
    updaterURL += '?notifyOnly=true';
  }
  modal.loadURL(updaterURL);

  for (const eventName of ['click-release-notes', 'click-skip', 'click-remind', 'click-install', 'click-download', 'click-cancel']) {
    const listener = createEventListener(modal, eventName);
    ipcMain.on(eventName, listener);
    modal.on('closed', () => {
      ipcMain.removeListener(eventName, listener);
    });
  }

  return modal;
}

function isUpdateApplicable(now, skippedVersion, updateInfo) {
  const releaseTime = new Date(updateInfo.releaseDate).getTime();

  // 48 hours after a new version is added to releases.mattermost.com, user receives a “New update is available” dialog
  if (now.getTime() - releaseTime < UPDATER_INTERVAL_IN_MS) {
    return false;
  }

  // If a version was skipped, compare version.
  if (skippedVersion) {
    return semver.gt(updateInfo.version, skippedVersion);
  }

  return true;
}

function downloadAndInstall(cancellationToken) {
  logger.info('autoUpdater: downloadAndInstall() entered');

  autoUpdater.on('update-downloaded', () => {
    logger.info('autoUpdater.on update-downloaded entered');
    global.willAppQuit = true;
    autoUpdater.quitAndInstall(true, true);
  });
  autoUpdater.downloadUpdate(cancellationToken);
}

function initialize(appState, mainWindow, notifyOnly = false) {
  logger.info('autoUpdater: initialize() entered');

  if (isDev) {
    // Useful for some dev/debugging tasks
    logger.info('autoUpdater: initialize(), using: ', path.join(__dirname, 'dev-app-update.yml'));
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
  }

  autoUpdater.autoDownload = false; // To prevent upgrading on quit
  const assetsDir = path.resolve(app.getAppPath(), 'assets');
  
  autoUpdater.on('error', (err) => {
    logger.info('autoUpdater: on.error entered, err is: ', err);
    console.error('Error in autoUpdater:', err.message);

  }).on('update-available', (info) => {
    logger.info('autoUpdater: on.update-available entered, info is: ', info);

    let cancellationToken = null;

    dialog.showMessageBox({
      type: 'info',
      title: 'Found Updates',
      message: 'New updates are available, do you want update to (' + info.version + ') now?',
      defaultId: 0,
      cancelId: 1,
      buttons: ['Yes', 'No']
    }, (buttonIndex) => {
      if (buttonIndex === 0) {
        logger.info('autoUpdater: on.update-available MessageBox said YES to update');
        cancellationToken = new CancellationToken();
        downloadAndInstall(cancellationToken);
      } 
      else {
        logger.info('autoUpdater: on.update-available MessageBox said NO to update');
        ipcMain.emit('auto-updater-menu', {type: 'update-is-available'});
      }
    });
  
    logger.info('autoUpdater: on.update-available after dialog.showMessageBox');

  }).on('update-not-available', (event) => {
    logger.info('autoUpdater: on.update-not-available, event is: ', event);
    if (autoUpdater.isManual) {
      dialog.showMessageBox({
        type: 'info',
        buttons: ['Close'],
        title: 'Your Desktop App is up to date',
        message: 'You have the latest version (' + event.version + ') of the MattermoZt Desktop App.',
      }, () => {}); // eslint-disable-line no-empty-function
    }

    ipcMain.emit('auto-updater-menu', {type: 'update-not-available'});

    setTimeout(() => {
      checkForUpdates(false);
    }, UPDATER_INTERVAL_IN_MS);
  });
}

function shouldCheckForUpdatesOnStart(updateCheckedDate) {
  if (updateCheckedDate) {
    if (Date.now() - updateCheckedDate.getTime() < UPDATER_INTERVAL_IN_MS) {
      return false;
    }
  }
  return true;
}

function checkForUpdates(isManual = false) {
  logger.info('autoUpdater: checkForUpdates() entered');
  autoUpdater.isManual = isManual;
  if (!updaterModal) {
    autoUpdater.checkForUpdates();
  }
}

class AutoUpdaterConfig {
  constructor() {
    this.data = {};
  }

  isNotifyOnly() {
    if (process.platform === 'win32') {
      return true;
    }
    if (this.data.notifyOnly === true) {
      return true;
    }
    return false;
  }
}

function loadConfig() {
  return new AutoUpdaterConfig();
}

export default {
  UPDATER_INTERVAL_IN_MS,
  checkForUpdates,
  shouldCheckForUpdatesOnStart,
  downloadAndInstall,
  initialize,
  loadConfig,
};
