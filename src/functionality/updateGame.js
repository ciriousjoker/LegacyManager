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

export function updateGame(Progress) {
    sync.fiber(function () {
        // TODO: Move this id to the button
        var Id = Constants.Game.GAME_SHORT.XP


        // TODO: Improve path verification
        // #region path verification
        var lm = getLocationManager();
        var notice = "\n\n\n\nDon't worry, this message box will look WAY more fancy in the final release.";
        if(settings.get(Constants.Settings.BrawlIsoLocation, "") === "") {
            alert("Please locate your Brawl .iso in the settings." + notice);
            return;
        }

        if(lm.get.GameFolder(Id) === "") {
            alert("Please choose your installation folder first." + notice);
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

            sync.await(gm.installGame(Id, UpdateInfo.Version, sync.defer()));
            console.log("Installed the game.");
        } else {
            console.log("No update available.");
        }
    });
    
}