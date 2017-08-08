// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

const setApplicationMenu = () => {
  const menus = [editMenuTemplate];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    minHeight: 400,
    minWidth: 600,
    width: 900,   // 'Hide' window while loading.
    height: 600,  // Setting 'show' to false doesn't create a window shadow.
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
  mainWindow.loadURL(indexPath);

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    //mainWindow.openDevTools();
    
    // Open the DevTools automatically if developing
    if (env.name === 'development') {
      installExtension([REACT_DEVELOPER_TOOLS])
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log('An error occurred: ', err));
      mainWindow.openDevTools();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});