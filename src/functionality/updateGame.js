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

export function updateGame(Id, Progress, cb) {
    sync.fiber(function () {
        // TODO: Move this id to the button
        var Id = Constants.Game.GAME_SHORT.XP


        // TODO: Improve path verification
        // #region path verification
        var lm = getLocationManager();
        var notice = "\n\n\n\nSorry for this ugly messagebox btw.";
        if (!settings.get(Constants.Settings.BrawlIsoLocation, false)) {
            alert("Please locate your Brawl .iso in the settings." + notice);
            return;
        }

        if (lm.get.GameFolder(Id) === "") {
            alert("Please choose your installation folder first." + notice);
            return;
        }

        if (!settings.get(Constants.Settings.PasswordLegacyXP, false)) {
            alert("Please set the Legacy XP password in the settings." + notice);
            return;
        }
        // #endregion path verification

        var dm = new DownloadManager(Progress);
        var gm = new GameManager(Progress);
        var game = GameInfo.get(Id);

        sync.await(Progress.setVisibility(true, sync.defer()));

        Progress.setMode(Total, Modes.Indeterminate);

        var UpdateInfo = sync.await(gm.isUpdateAvailable(Id, sync.defer()));
        Progress.setMode(Total, Modes.Determinate);

        if (UpdateInfo) {
            console.log("Installing:", UpdateInfo.Version);

            var result = sync.await(gm.installGame(Id, UpdateInfo.Version, sync.defer()));
            console.log("Installed the game: ", result);
            cb(null, result);
            return;
        } else {
            console.log("No update available.");
        }
        cb(null, true);
    });

}