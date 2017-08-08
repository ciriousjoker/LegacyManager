// Helper functions
// ================

'use strict';

// TODO: Split into helpers/packages

const os = require('os');

//const os = require('os');

var { Constants } = require('./Constants.js');


// Converts current/total into a percentage
function getProgress(current, total, cb) {
    var progress = Math.round(current * 100 / total);
    if (progress > 100) {
        progress = 100;
    }

    // Standard callback
    // TODO: Change all callbacks to cb(err, data);
    if (cb != null) { cb(null, progress); }

    return progress;
}

// Returns the operating system
function checkOs(cb) {
    var detect = Constants.Regex.OSDetection;
    var code = os.platform();

    var OperatingSystem = Constants.OS.Unsupported;      // Unsupported

    if (detect.Windows.test(code)) {        // Windows
        OperatingSystem = Constants.OS.Windows;
    } else if (detect.Mac.test(code)) {     // Mac OS
        OperatingSystem = Constants.OS.Mac;
    } else if (detect.Linux.test(code)) {   // Linux
        OperatingSystem = Constants.OS.Linux;
    }

    // Standard callback
    if (cb != null) { cb(null, OperatingSystem); }

    return OperatingSystem;
}

// TODO: Make a Helper object with subfunctions instead

module.exports = {
    // Check if variable is defined
    isdef: function (o) {
        if (typeof o !== 'undefined') {
            return true;
        }
        return false;
    },
    // Parse a json string
    parseJson: function (data, callback) {
        console.log(data.jsonstring);
        var obj = JSON.parse(data.jsonstring);
        console.log("done.");

        var obj_with_key = {};

        for (var i = 0; i < obj.length; i++) {
            obj_with_key[obj[i].hash + obj[i].path] = obj[i];
        }

        console.log(obj_with_key);
        callback(null, obj_with_key);
    },
    checkOs,
    getProgress
};