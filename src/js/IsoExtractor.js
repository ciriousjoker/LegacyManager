// IsoExtractor
// ============


var child_process = require('child_process');
const path = require('path');
const fs = require('fs-extra');

var { Constants } = require('./Constants.js');
var { isdef, checkOs } = require('./Helpers.js')
var { getLocationManager } = require('./LocationManager.js');

var IsoExtractorHolder = {};

function getIsoExtractor(id, cb) {
    if (!isdef(IsoExtractorHolder[id])) {
        IsoExtractorHolder[id] = new IsoExtractor(id);
    }

    // Standard callback
    if (cb != null) { cb(IsoExtractorHolder[id]); }

    return IsoExtractorHolder[id];
}

// Progress constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;

var IsoExtractor = function (Id, Progress) {
    var _this = this;
    this.Id = Id;
    this.Progress = Progress;

    this.ExtractIso = function (options, cb) {
        // Imports
        var { getLocationManager } = require('./LocationManager.js');

        var InputFile = options.InputFile;
        var OutputFolder = options.OutputFolder;
        var Id = options.Id;

        var preparation = new Promise(function (resolve, reject) {
            // Remove any existing folder wth files in it
            fs.remove(OutputFolder, function (err) {
                resolve();
            });
        });

        preparation.then(function (result) {
            var lm = getLocationManager();

            if (checkOs() == Constants.OS.Unsupported) {
                cb("Couldn't determine your OS. Please make sure it's either Windows, Linux or Mac", "Error while extracting the .iso");
                Progress.cancel();
                return;
            }

            // TODO: Create Logmanager
            // TODO: Make constants and remove all the strings
            var logfile = path.join(lm.get.LogFolder(), "extract_" + new Date().getTime() + ".log");

            var WitLocation = lm.get.WitLocation(Id);

            // TODO: Add quotation marks to the paths
            var WitArguments = ['extract', InputFile, OutputFolder, '--psel=DATA', '-ovv'];

            var check = Constants.Regex.WitProcessing;

            fs.pathExists(InputFile)
                .then((exists) => {
                    if (!exists) {
                        console.log("Couldn't extract " + InputFile + ". The file doesn't exist.")
                        cb(null, false);
                    }

                    var WitProcess = child_process.spawn(WitLocation, WitArguments);
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
                            console.log("Killed .iso extraction");
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

                            // Check if the status includes an ETA
                            var etaline = check.HasETA.exec(line);
                            if (etaline) {
                                // Extract the ETA out of the status
                                var eta = etaline[0].split(" ")[1];

                                _this.Progress.setStatusSuffix(" - Estimated time left: " + eta);
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
                        _this.Progress.setStatusSuffix("");

                        if (_this.Progress.isCancelled()) {
                            console.log("Done with extracting the .iso");
                            cb(null, true);
                        } else {
                            console.log("Cancelled extracting the .iso");
                            cb(null, false);
                        }
                    });
                });
        });
    }
}

module.exports = {
    IsoExtractor,
    getIsoExtractor
};