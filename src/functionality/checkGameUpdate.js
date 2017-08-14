'use strict';

const sync = require('synchronize');
const settings = require('electron-settings');
const { Constants } = require('./js/Constants.js');
const { DownloadManager } = require('./js/DownloadManager.js');
const { GameManager, GameInfo } = require('./js/GameManager.js');
const { getLocationManager } = require('./js/LocationManager.js');

// Simplified constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;
var Modes = Constants.Progress.Modes;

export function checkGameUpdate(Id, cb) {
    sync.fiber(function () {

        // TODO: Improve path verification
        // #region path verification
        var lm = getLocationManager();
        var notice = "\n\n\n\nDon't worry, this message box will look WAY more fancy in the final release.";
        if(!settings.get(Constants.Settings.BrawlIsoLocation, false)) {
            alert("_Please locate your Brawl .iso in the settings." + notice);
            return;
        }

        if(lm.get.GameFolder(Id) === "") {
            alert("_Please choose your installation folder first." + notice);
            return;
        }
        // #endregion path verification


        var gm = new GameManager();

        var result = sync.await(gm.isUpdateAvailable(Id, sync.defer()));
        console.log("Update available:", result);
        cb(null, result);
    });
}