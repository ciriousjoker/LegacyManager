// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu, ipcMain } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';

// Auto updating
import { autoUpdater } from "electron-updater"


// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

var MainWindow;

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  launchManager();
});

app.on('window-all-closed', () => {
  app.quit();
});

function launchManager() {
  MainWindow = createWindow('manager', {
    minHeight: 400,
    minWidth: 600,
    width: 900,
    height: 600,
    frame: false,
    transparent: true,
    show: false
  });

  // and load the index.html of the app.
  let indexPath = url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true,
  });

  console.log("Viewing: " + indexPath);
  MainWindow.loadURL(indexPath);

  // Don't show until we are ready and loaded
  MainWindow.once('ready-to-show', () => {
    MainWindow.show();
    MainWindow.focus();

    //MainWindow.openDevTools();

    // Open the DevTools automatically if developing
    if (env.name === 'development') {
      installExtension([REACT_DEVELOPER_TOOLS])
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
      MainWindow.openDevTools();
    }
  });
}




// IPC
// Auto updating
ipcMain.on('check-update', (event, arg) => {
  autoUpdater.checkForUpdates();
  event.sender.send('update-checked', false);

  autoUpdater.on('update-available', (info) => {
    event.sender.send('update-checked', info);
  })

  autoUpdater.on('update-not-available', (info) => {
    event.sender.send('update-checked', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    event.sender.send('update-progress', progress.percent);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log("Updating on exit.");
    event.sender.send('update-downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    console.error(err);
  });
});