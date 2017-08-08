// CSharpManager
// =============

'use strict';

const edge = window.require('electron-edge');
const path = require('path');
const { Constants } = require('./Constants.js');
const { isdef, parseJson, checkOs } = require('./Helpers.js');
const { getLocationManager, LocationConstants } = require('./LocationManager.js');

// C# Functions
const _DecryptFile = edge.func("./src/cs/DecryptFile.csx");

// TODO: Deprecated, remove it
var logfolder = __dirname;

// TODO: Write proxy for Progress.isCancelled()

// Progress constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;

// Internal function for generating StatusTray proxies
function createStatusTrayProxies(Id, Progress) {
    return {
        setProgress: function (data, cb) {
            Progress.setProgress(data.type, data.value, cb);
        },
        setStatus: function (data, cb) {
            Progress.setStatus(data.status, cb);
        },
        isCancelled: function (ignored, cb) {
            Progress.isCancelled((err, result) => {
                cb(null, result);
            });
        },
        reset: function (ignored, cb) {
            Progress.reset(cb);
        }
    }
}

function createHelperProxies() {
    return {
        checkOs: function (ignored, cb) {
            checkOs(cb);
        }
    }
}

// Proxy functions
function DecryptFile(pack, cb) {
    var InputFile = pack.InputFile;
    var OutputFile = pack.OutputFile;
    var Password = pack.Password;
    var Progress = pack.Progress;
    var Id = pack.Id;

    var lm = getLocationManager();

    var pack = {
        Constants,
        data: {
            InputFile,
            OutputFile,
            Password,
            LogFile: path.join(lm.get.LogFolder(), "extract" + new Date().getTime() + ".log"),  // TODO: Remove once a real logging solution is implemented
            Id,
            StatusTray: createStatusTrayProxies(Id, Progress),
            Helper: createHelperProxies()
        }
    }
    
    _DecryptFile(pack, cb);
}


var CSharpManager = {
    DecryptFile
}


module.exports = {
    CSharpManager
};