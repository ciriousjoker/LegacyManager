// DownloadManager
// ===============

'use strict';


const fs = require('fs-extra');
const sync = require('synchronize');
const os = require('os');
const path = require('path');
const request = require('request');
const settings = require('electron-settings');

var { isdef } = require('./Helpers.js')
var { Constants } = require('./Constants.js');
var { LocationConstants } = require('./LocationManager.js');


// Simplified constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;
var Modes = Constants.Progress.Modes;


function isBlockedByGoogle(response) {
    // Go through all cookies and see if Google serves the
    // "this file cannot be scanned"-page instead of the actual file
    try {
        var cookie_bundle = response.headers['set-cookie'];
        for (var i = 0; i < cookie_bundle.length; i++) {
            var cookie = cookie_bundle[i];

            var regex_cookie_name = /download_warning_(.*)=....;/g;
            var cookie_name = cookie.match(regex_cookie_name);

            // If the cookie was a download_warning-cookie
            if (cookie_name && cookie_name.length > 0) {
                //console.log("found download warning");

                var regex_cookie_code = /=.*;/g;
                var cookie_code = cookie_name[0].match(regex_cookie_code);

                // If a code can be extracted
                if (cookie_code && cookie_code.length > 0) {
                    // Extract the code
                    var code = cookie_code[0].substring(1, cookie_code[0].length - 1);
                    console.log("Unblocked: " + code);
                    return code;
                }
            }
        }
    } catch (ignored) {

    }
    return false;
}

function DownloadManager(Progress) {
    var _this = this;
    this.Progress = Progress;

    // External functions
    this.UpdateDatabase = function (cb) {
        // TODO: Add force flag to force redownloading
        // TODO: Add a proxy url that just redirects to the new URL
        sync.fiber(function () {
            var remotefile = {
                Url: fs.readFileSync(LocationConstants.Filenames.DatabaseServer).toString(),
                Size: 1491,    // TODO: Make download show an indeterminate progress bar if specified
                ReadToMemory: true,
                DataType: "json",   // TODO: Change to constant
                Status: "Downloading database" // TODO: Change to constant
            }

            var db = sync.await(_this.dl(remotefile, sync.defer())).jsondata;

            // TODO: Change to constant
            settings.set("offline_db", db);

            return db;
        }, cb);
    }

    /*
    // remotefile structure
    var remotefile = {
        Url: string,
        Size: long,
        Filename: string | pulled from header
        ReadToMemory: boolean,
        DataType: "json"|null
    }
    */
    this.dl = function (remotefile, cb) {
        _this.Progress.setMode(Current, Modes.Indeterminate);
        
        var url = remotefile.Url;

        // Progress
        var Progress = {
            Current: 0,

            // Overwritten by any size that the server reports
            Total: remotefile.Size,
            Last: 0
        }

        // Paths
        var filename = remotefile.Filename || (Constants.TmpFilePrefix + new Date().getTime());
        var downloadfolder = remotefile.DownloadFolder || os.tmpdir();
        var filepath = path.join(downloadfolder, filename);

        // Create download folder if necessary
        fs.ensureDirSync(downloadfolder);

        console.log("File path: " + filepath);

        var stream = fs.createWriteStream(filepath, {
            mode: 0o777
        });
        var cookie_jar = remotefile.cookie_jar || request.jar();

        // Default request options
        // If the download was blocked, this will be modified later
        var request_options = {
            method: 'GET',
            uri: url,
            encoding: null,
            jar: cookie_jar,
            gzip: false,
        }


        var req = request(request_options);

        req.pipe(stream);

        req.on('response', function (response) {
            // If the site was reachable
            if (response && response.statusCode == 200) {

                // Check if the server reported a filesize
                if (isdef(response.headers['content-length'])) {
                    Progress.Total = parseInt(response.headers['content-length']);
                    //console.log(Progress.Total);
                }

                // Check if the download was blocked by Google
                // and unblock it if possible.
                // This is only necessary when downloading files bigger than 50 mb from Google Drive
                // This code is found in the cookie section of the response header
                // The code can then be appended to the url to try again
                var GoogleUnblockCode = isBlockedByGoogle(response);
                if (GoogleUnblockCode) {
                    req.abort();
                    remotefile.Url += "&confirm=" + GoogleUnblockCode;
                    remotefile.unblocked = true;
                    remotefile.cookie_jar = cookie_jar;

                    // Close the stream and try again
                    stream.on('finish', function () {
                        // Remove the old file
                        fs.unlink(filepath, function () {
                            // Try again. The Timeout might not be necessary, although I had some problems without it.
                            setTimeout(function () {
                                cb(null, remotefile);
                            }, 1700);
                        });
                    });

                    // Close the stream
                    stream.end();
                    return;
                }

                _this.Progress.setMode(Current, Modes.Determinate);
            } else {
                console.log("Download failed: " + response.statusCode);
                req.abort();
                // TODO: Implement Progress.reset() here
                _this.Progress.setProgress(Current, 0);
                _this.Progress.setProgress(Total, 0);
            }
        });

        req.on('data', function (data) {
            Progress.Current += data.length;
            if (Number.isInteger(Progress.Total)) {
                // Only update the progress when something changed
                if ((Progress.Current - Progress.Last) > Constants.Progress.BufferedStepSizeSmallest * 1024 * 1024) {
                    var progress = Math.round(Progress.Current * 100 / Progress.Total);
                    var megabytes = Math.round(Progress.Current / 1024 / 1024);

                    // Progress can't be higher than 100
                    progress = (progress >= 100) ? 100 : progress;


                    _this.Progress.setStatusSuffix(": " + megabytes + " mb");
                    _this.Progress.setProgress(Current, progress);

                    Progress.Last = Progress.Current;
                }
            } else {
                // Set indeterminate
                _this.Progress.setMode(Current, Modes.Indeterminate);
            }

            if (_this.Progress.isCancelled()) {
                req.abort();
                console.log("Download aborted.");
                // TODO: Implement Progress.reset() here
                _this.Progress.setProgress(Current, 0);
                _this.Progress.setProgress(Total, 0);
            }
        });

        req.on('end', function () {
            stream.on('finish', function () {
                remotefile.downloaded = true;

                _this.Progress.setStatusSuffix("");

                // Return either the json object or the filepath
                if (remotefile.ReadToMemory) {
                    if (remotefile.DataType == "json") {
                        remotefile.jsondata = fs.readJsonSync(filepath);
                    }
                } else {
                    remotefile.filepath = filepath;
                }

                // This delay MAY be necessary if you try to download many big files (12+),
                // the Dev tools disconnect for no reason.
                // I have not figured out why, but adding a delay here fixes this problem.
                if (remotefile.delay) {
                    setTimeout(function () {
                        cb(null, remotefile);
                    }, 5000);
                } else {
                    cb(null, remotefile);
                }
            });

            // Close the stream
            stream.end();
        });

        req.on('error', function (err) {
            console.log("ERROR: ");
            console.log(err);
            _this.Progress.cancel();
        });
    }

    this.download = function (remotefile, cb) {
        _this.dl(remotefile, function (err, data) {
            if (data.downloaded) {
                cb(err, data);
            } else if (data.unblocked) {
                _this.dl(data, cb);
            } else {
                cb("File couldn't be downloaded or unblocked");
            }
        });
    }
}

// Exports
module.exports = {
    DownloadManager
};