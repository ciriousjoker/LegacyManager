// BrawlPatcher
// ============


// Extracting 7zip files
const dirSearch = require('walkdir');
const path = require('path');
const fs = require('fs-extra')
const sync = require('synchronize');
const fileExists = require('file-exists');
const LineByLineReader = require('line-by-line');
const child_process = require('child_process');
const slash = require('slash');

var { Constants } = require('./Constants.js');
var { isdef, getProgress } = require('./Helpers.js')
var { LocationConstants, getLocationManager } = require('./LocationManager.js');


// TODO: Ad logging mechanism

// Progress constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;
var Modes = Constants.Progress.Modes;
var BufferedStepSizeSmallest = Constants.Progress.BufferedStepSizeSmallest;
var TimoutAt100Percent = Constants.Animation.Duration.TimoutAt100Percent;

var BrawlPatcher = function (Id, Progress) {
    var _this = this;
    this.Id = Id;
    this.Progress = Progress;

    // Imports
    this.LocationConstants = require('./LocationManager.js').LocationConstants;
    this.getLocationManager = require('./LocationManager.js').getLocationManager;

    this.PatchExtractedIso = function (options, cb) {
        var ModBasePath = options.ModBasePath;
        var ExtractedBrawlLocation = options.ExtractedBrawlLocation;
        var Id = options.Id;

        // Set the status
        _this.Progress.setStatus("Preparing to copy mod files");
        _this.Progress.setMode(Current, Modes.Indeterminate);

        var files = [];
        var dirSearchEmitter = dirSearch(ModBasePath);

        dirSearchEmitter.on('file', function (path, stat) {
            files.push(path);
            if (_this.Progress.isCancelled()) { this.end(); }
        });

        dirSearchEmitter.on('end', function (ignored, stat) {
            _this.Progress.setMode(Current, Modes.Indeterminate);

            sync.fiber(function () {
                var LastEmittedProgress = 0;
                var TotalFileCount = files.length;
                var StatusUpdateTimestamp = 0;

                var lastTime = 0;


                _this.Progress.setStatus("Copying game files");
                for (var CurrentFileIndex = 0; CurrentFileIndex < TotalFileCount; CurrentFileIndex++) {
                    var FilePath = files[CurrentFileIndex];
                    var SubPath = FilePath.substring(ModBasePath.length);
                    var NewFilePath = path.join(ExtractedBrawlLocation, _this.LocationConstants.Folders.BrawlFiles, SubPath);

                    var copyResult = sync.await(fs.copy(FilePath, NewFilePath, sync.defer()));
                    if (_this.Progress.isCancelled()) { return; }

                    // TODO: Change to constant for StatusUpdateDelay in ms
                    if (Math.floor((new Date() - StatusUpdateTimestamp) / 1000) > 200) {
                        _this.Progress.setStatusSuffix(": " + path.basename(FilePath));
                    } else {
                        StatusUpdateTimestamp = new Date();
                    }

                    var CurrentProgress = getProgress((CurrentFileIndex + 1), TotalFileCount);
                    if (CurrentProgress - LastEmittedProgress >= BufferedStepSizeSmallest) {
                        _this.Progress.setProgress(Current, CurrentProgress);
                        LastEmittedProgress = CurrentProgress;
                    }
                }

                // TODO: Unhardcode this part
                try {
                    var common_location = path.join(ExtractedBrawlLocation, _this.LocationConstants.Folders.BrawlFiles, "system");

                    // Renaming these files is necessary, otherwise the game crashes while loading
                    fs.renameSync(path.join(common_location, "common.pac"), path.join(common_location, "common_en.pac"));
                    fs.renameSync(path.join(common_location, "common4.pac"), path.join(common_location, "common4_en.pac"));
                    fs.renameSync(path.join(common_location, "common5.pac"), path.join(common_location, "common5_en.pac"));
                } catch (ignored) {
                    // No problem, might be that they're already renamed
                    // TODO: Add logs anyway
                    console.log("common.pac files couldn't be renamed. This might lead to problems later.");
                }

                _this.Progress.setStatusSuffix("", () => {
                    _this.Progress.setStatus("Done patching.", () => {
                        _this.Progress.reset();
                    });
                });

                // Standard callback
                if (cb != null) { cb(null, "Done patching."); }
            });
        });

        // Make it chainable
        return _this;
    }

    this.CleanupExtractedIso = function (options, cb) {

        var ExtractedBrawlLocation = options.ExtractedBrawlLocation;
        var BlackList = options.BlackList;
        var Id = options.Id;

        // Check if a blacklist is present
        if (!fileExists.sync(BlackList)) {
            var err = new Error("Blacklist couldn't be found: " + BlackList);
            cb(err);
            return err;
        }

        _this.Progress.setStatus("Preparing to clean up the .iso");
        _this.Progress.setMode(Current, Modes.Indeterminate);


        var files = [];

        var reader = new LineByLineReader(BlackList);

        reader.on('error', function (err) {
            throw "Blacklist couldn't be read: " + err;
        });

        reader.on('line', function (line) {
            files.push(path.join(ExtractedBrawlLocation, _this.LocationConstants.Folders.BrawlFiles, line));
        });

        reader.on('end', function () {
            _this.Progress.setMode(Current, Modes.Determinate);

            sync.fiber(function () {
                var progress_last = 0;
                var total = files.length;
                for (var current = 0; current < total; current++) {
                    var FilePath = files[current];

                    try {
                        sync.await(fs.unlink(FilePath, sync.defer()));
                    } catch (e) {
                        // Only throw the exception if the file couldn't be deleted
                        if (fileExists.sync(FilePath)) {
                            throw e;
                        }
                        continue;
                    }

                    if (_this.Progress.isCancelled()) { return; }

                    _this.Progress.setStatus("Removed: " + path.basename(FilePath));

                    var progress = getProgress((current + 1), total);
                    if (progress - progress_last >= Constants.Progress.BufferedStepSizeSmallest) {
                        _this.Progress.setProgress(Current, progress);
                        progress_last = progress;
                    }
                }

                // Standard callback
                if (cb != null) { cb(null, "done patching."); }
            });
        });

        // Make it chainable
        return _this;
    }

    // Downgrade the extracted .iso from version 1.02 to 1.00
    this.DowngradeExtractedIso = function (options, cb) {
        var DowngradeBasePath = options.DowngradeBasePath;
        var ExtractedBrawlLocation = options.ExtractedBrawlLocation;
        var Id = options.Id;

        _this.Progress.setStatus("Downgrading the extracted .iso");
        _this.Progress.setMode(Current, Modes.Indeterminate);

        var files = [];
        var dirSearchEmitter = dirSearch(DowngradeBasePath);

        dirSearchEmitter.on('file', function (path, stat) {
            files.push(path);
            if (_this.Progress.isCancelled()) { this.end(); }
        });

        dirSearchEmitter.on('end', function (ignored, stat) {
            sync.fiber(function () {
                var progress_last = 0;
                var total = files.length;
                for (var current = 0; current < total; current++) {
                    var FilePath = files[current];
                    var SubPath = FilePath.substring(DowngradeBasePath.length);
                    var NewFilePath = path.join(ExtractedBrawlLocation, SubPath);

                    var copyResult = sync.await(fs.copy(FilePath, NewFilePath, sync.defer()));
                    if (_this.Progress.isCancelled()) { return; }
                }

                // Timeout is only there for aesthetics
                setTimeout(function () {
                    _this.Progress.setMode(Current, Modes.Determinate);

                    // Standard callback
                    if (cb != null) { cb(null, "Done downgrading."); }
                }, TimoutAt100Percent);
            });
        });

        // Make it chainable
        return _this;
    }

    // Apply the dolpatch
    this.ApplyDolpatch = function (options, cb) {
        var WitLocation = options.WitLocation;
        var BrawlFolder = options.BrawlFolder;
        var DolFolder = options.DolFolder;
        var Id = options.Id;

        var lm = _this.getLocationManager();

        /*
            Notes:
            Wit can't deal with partitions on Windows, so the idea is
            to make the pathes relative and instead set the current working directory
        */
        var DolCodehandler = path.join(DolFolder, _this.LocationConstants.Folders.DolCodehandler);
        var DolPatchCommon = path.join(DolFolder, _this.LocationConstants.Folders.DolPatchCommon);
        var DolLocation = lm.get.DolLocation();



        _this.Progress.setStatus("Applying the dolpatch");
        _this.Progress.setMode(Current, Modes.Indeterminate);

        // TODO: Create Logmanager
        // TODO: Make constants and remove all the strings
        var logfile = path.join(lm.get.LogFolder(), "dolpatch_" + new Date().getTime() + ".log");

        var WitArguments = ['dolpatch', slash(DolLocation), "NEW=TEXT,80001800,10C0", 'LOAD=80001800,' + slash(DolCodehandler), 'XML=' + slash(DolPatchCommon), '805A14B8=5850', 'NEW=DATA,80570000,None', 'LOAD=80570000,codes/RSBEXP-WIFI.gct'];


        var WitProcess = child_process.spawn(WitLocation, WitArguments, {
            cwd: lm.get.GameFolder(Id)
        });

        var result;
        WitProcess.stdout.on('data', function (data) {
            // Convert from buffer to string
            var line = data + "";

            // Buffer for later evaluation
            result += line;
            fs.appendFile(logfile, line);

            // Allow to cancel the patching (although patching is
            // so fast, that this will probably never be called)
            if (_this.Progress.isCancelled()) {
                WitProcess.kill('SIGTERM');
                return;
            }
        });

        WitProcess.stderr.on('data', function (data) {
            // Usually, the only error (always) coming up doesn't matter,
            // so we'll ignore it here. Logging errors should be enough.
            fs.appendFile(logfile, data);
        });

        WitProcess.on('close', function (code) {
            fs.appendFile(logfile, "wit ended with exit code: " + code);

            var ReturnCodes = Constants.Tools.Wit.ReturnCode.Dolpatch;

            // Timeout is only there for aesthetics
            setTimeout(function () {
                _this.Progress.setMode(Current, false);

                // Callback depending on the outcome
                if (_this.Progress.isCancelled()) {
                    cb(null, Constants.Keys.Cancelled);
                } else if (code != ReturnCodes.OK) {
                    cb("Error while dolpatching. See logfiles for more information.", "Error while dolpatching.");
                } else {
                    cb(null, "Done with dolpatching.");
                }
            }, TimoutAt100Percent);
        });
    }

    // Build the patched .wbfs
    this.BuildPatchedWbfs = function (options, cb) {
        // Imports
        var { LocationConstants, getLocationManager } = require('./LocationManager.js');

        var WitLocation = options.WitLocation;          // TODO: Remove this
        var BrawlFolder = options.BrawlFolder;          // TODO: Remove this
        var FinalGameFolder = options.FinalGameFolder;  // TODO: Remove this

        var Id = options.Id;
        var GameCode = Constants.Game.GAME_CODE.XP;
        var GameName = Constants.Game.GAME_NAME.XP;

        var lm = getLocationManager();

        var FinalGameLocation = path.join(lm.get.GameFolder(Id), LocationConstants.Folders.FinalGameFolder, Constants.Game.GAME_NAME.XP + Constants.Game.GAME_EXT.XP);

        /*
            Notes:
            Wit can't deal with partitions on Windows, so the idea is
            to make the pathes relative and instead set the current working directory
        */



        _this.Progress.setStatus("Building the patched .wbfs");

        // TODO: Create Logmanager
        // TODO: Make constants and remove all the strings
        var logfile = path.join(lm.get.LogFolder(), "building_" + new Date().getTime() + ".log");


        var WitArguments = ['copy', slash(BrawlFolder), slash(FinalGameLocation), "-ovv", '--disc-id=' + GameCode, '--boot-id=' + GameCode, '--tt-id=K', '--name=' + GameName];

        var check = Constants.Regex.WitProcessing;

        var WitProcess = child_process.spawn(WitLocation, WitArguments, {
            cwd: lm.get.GameFolder(Id)
        });

        WitProcess.stdout.on('data', function (data) {
            // Convert from buffer to string
            var line = data + "";

            // Log the output
            fs.appendFile(logfile, line);

            // Examples of a line returned by wit
            // > Some random intro
            // >        18% copied in 0:31 (41.0 MiB/sec)
            // >        18% copied in 0:31 (41.0 MiB/sec) -> ETA 2:22

            // Allow to cancel this extraction process
            if (_this.Progress.isCancelled()) {
                WitProcess.kill('SIGTERM');
                return;
            }

            // Check if the line contains a status update
            var statusline = check.IsStatus.exec(line);
            if (statusline) {
                // Extract the percentage out of the status
                var CurrentProgress = parseInt(statusline[0].split("%")[0]);

                if (Number.isInteger(CurrentProgress)) {
                    _this.Progress.setProgress(Current, CurrentProgress);
                }

                var status = Constants.Progress.Status.BuildPatchedWbfs;

                // Check if the status includes an ETA
                var etaline = check.HasETA.exec(line);
                if (etaline) {
                    // Extract the ETA out of the status
                    var eta = etaline[0].split(" ")[1];
                    status += " - Estimated time left: " + eta;
                    _this.Progress.setStatusSuffix(status);
                }
            }
        });

        WitProcess.stderr.on('data', function (data) {
            // Usually, the only error (always) coming up doesn't matter,
            // so we'll ignore it here. Logging errors should be enough.
            fs.appendFile(logfile, data);
        });

        WitProcess.on('close', function (code) {
            fs.appendFile(logfile, "wit ended with exit code: " + code);

            var ReturnCodes = Constants.Tools.Wit.ReturnCode.BuildPatchedWbfs;

            _this.Progress.setStatusSuffix("");
            if (code == ReturnCodes.OK) {
                _this.Progress.setProgress(Current, 100);
            }

            setTimeout(function () {
                // Callback depending on the outcome
                if (_this.Progress.isCancelled()) {
                    cb(null, Constants.Keys.Cancelled);
                } else if (code != ReturnCodes.OK) {
                    cb("Error while building the .wbfs. See logfiles for more information.", "Error while building the .wbfs.");
                } else {
                    cb(null, "Done with building the .wbfs.");
                }
            }, TimoutAt100Percent);
        });
    }
}

module.exports = {
    BrawlPatcher
};