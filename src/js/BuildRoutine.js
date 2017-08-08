// BuildRoutine
// ============

'use strict';

const path = require('path');
const settings = require('electron-settings');
const sync = require('synchronize');

var { Constants } = require('./Constants.js');
var { isdef, checkOs } = require('./Helpers.js')
var { LocationConstants, LocationManager, getLocationManager } = require('./LocationManager.js');
var { IsoExtractor, getIsoExtractor } = require('./IsoExtractor.js');
var { BrawlPatcher } = require('./BrawlPatcher.js');

// Progress constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;

var BuildRoutine = {
    [Constants.Game.GAME_SHORT.XP]: function (Id, Progress, cb) {
        sync.fiber(function () {
            // Imports
            var { LocationConstants, getLocationManager } = require('./LocationManager.js');

            var lm = getLocationManager();

            // TODO: Remove old folder if it exists

            // #region Extract the .iso
            var IsoLocation = lm.get.IsoLocation();
            var ExtractedBrawlLocation = lm.get.ExtractedBrawlLocation();
            var InstallationFolder = lm.get.GameFolder(Id);
            var ie = new IsoExtractor(Id, Progress);

            var options = {
                InputFile: IsoLocation,
                OutputFolder: ExtractedBrawlLocation,
                Id
            };
            Progress.setStatus(Constants.Progress.Status.WitExtraction);
            sync.await(ie.ExtractIso(options, sync.defer()));
            // #endregion Extract the .iso


            // #region Patch the extracted .iso
            var bp = new BrawlPatcher(Id, Progress);
            var ModBasePath = lm.get.ModBasePath(Id);
            var options = {
                ModBasePath,
                ExtractedBrawlLocation,
                Id
            };
            sync.await(bp.PatchExtractedIso(options, sync.defer()));
            // #endregion Patch the extracted .iso


            // #region Clean up the extracted .iso
            var BlackList = lm.get.BlackList(Id);
            var options = {
                ExtractedBrawlLocation,
                BlackList,
                Id
            };
            sync.await(bp.CleanupExtractedIso(options, sync.defer()));
            // #endregion Clean up the extracted .iso


            // #region Downgrade the extracted .iso
            var DowngradeBasePath = lm.get.DowngradeBasePath(Id);
            var options = {
                DowngradeBasePath,
                ExtractedBrawlLocation,
                Id
            };
            sync.await(bp.DowngradeExtractedIso(options, sync.defer()));
            // #endregion Downgrade the extracted .iso


            // #region Apply the dolpatch
            var WitLocation = lm.get.WitLocation(Id);
            var BrawlFolder = lm.get.ExtractedBrawlLocation();
            var DolFolder = LocationConstants.Folders.DolFolder;
            var options = {
                WitLocation,    // TODO: Remove this
                BrawlFolder,    // TODO: Remove this
                DolFolder,      // TODO: Remove this
                Id
            };
            sync.await(bp.ApplyDolpatch(options, sync.defer()));
            // #endregion Apply the dolpatch


            // #region Build patched .wbfs
            var FinalGameFolder = path.join(lm.get.GameFolder(Id), LocationConstants.Folders.FinalGameFolder);

            var options = {
                WitLocation,        // TODO: Remove this
                BrawlFolder,        // TODO: Remove this
                FinalGameFolder,    // TODO: Remove this
                Id
            };

            sync.await(bp.BuildPatchedWbfs(options, sync.defer()));
            // #endregion Build patched .wbfs

            Progress.setProgress(Total, 100);
            Progress.setProgress(Current, 100);

            Progress.setStatus("Done.");
            setTimeout(function () {
                Progress.reset();
                cb(null, true);
            }, Constants.Animation.TimoutAt100Percent);

            return true;
        });
    }
}

module.exports = {
    BuildRoutine
};