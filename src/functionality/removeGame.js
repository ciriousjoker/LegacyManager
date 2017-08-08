'use strict';

const sync = require('synchronize');
const settings = require('electron-settings');
const { Constants } = require('./js/Constants.js');
const { GameManager, GameInfo } = require('./js/GameManager.js');
const { getLocationManager } = require('./js/LocationManager.js');

// Simplified constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;
var Modes = Constants.Progress.Modes;

export function removeGame(Id, Progress) {
    sync.fiber(function () {
        var gm = new GameManager(Progress);

        // TODO: Show confirmation dialog

        // Set the progress bars
        sync.await(Progress.setVisibility(true, sync.defer()));
        sync.await(Progress.setStatus("Uninstalling the game", sync.defer()));
        sync.await(Progress.setMode(Total, Modes.Indeterminate, sync.defer()));

        // Uninstall the game
        var ResultUninstalled = sync.await(gm.uninstallGame(Id, sync.defer()));

        // Reset the progress bars
        sync.await(Progress.setStatus("Uninstalled the game.", sync.defer()));
        Progress.setMode(Total, Modes.Determinate);
        
        console.log("Uninstalled the game", ResultUninstalled);
    });
}