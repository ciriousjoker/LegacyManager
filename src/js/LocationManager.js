// LocationManager
// ===============

'use strict';

const path = require('path');
const fs = require('fs-extra');
const isPath = require('is-valid-path');
const settings = require('electron-settings');

var { Constants } = require('./Constants.js');
var { isdef, checkOs } = require('./Helpers.js')
var { GameManager, GameInfo } = require('./GameManager.js');


var LocationmanagerHolder;

function getLocationManager(cb) {
    // Recreate it anyway, so changes in the UI reflect instantly
    if (!isdef(LocationmanagerHolder)) {
        LocationmanagerHolder = new LocationManager();
    }

    // Standard callback
    if (cb != null) { cb(LocationmanagerHolder); }

    return LocationmanagerHolder;
}

// TODO: Reorder the location constants
var LocationConstants = {
    Extensions: {
        DownloadedPackage: ".enc",
        DecryptedPackage: ".7z"
    },
    Folders: {
        Git: {
            Keystorage: "../../_ssh_keys/legacymanager"
        },
        Download: "_dl",
        Log: "_log",
        ModBasePath: path.join("Legacy XP", "WBFS", "Builder", "LegacyXP", "pf"),
        DowngradeBasePath: path.join("Legacy XP", "WBFS", "Builder", "Resources", "1.02fix"),
        BrawlFolder: "_smbb",
        BrawlFiles: "files",
        DolLocation: path.join("sys", "main.dol"),
        DolFolder: path.join("Legacy XP", "WBFS", "Builder", "Resources", "patch"),
        DolCodehandler: "codehandler.bin",
        DolPatchCommon: "PatchCommon.xml",
        DolphinFolder: "Dolphin LXP",
        FinalGameFolder: path.join("Legacy XP", "WBFS"),
        BlackList: path.join("Legacy XP", "WBFS", "Builder", "Resources", "black.list"),
        Tools: {
            Wit: path.join("Legacy XP", "WBFS", "Builder", "Resources", "WIT")
        }
    },
    Filenames: {
        TmpFilePrefix: ".1x9m3tb19g_",
        SSHPublicKey: "public.key",     // TODO: Remove
        SSHPrivateKey: "private.key",   // TODO: Remove
        GameInfo: ".gameinfo",
        DefaultPassword: ".passwd",     // TODO: Move to config/
        DatabaseServer: ".server",      // TODO: Move to config/
        FileDownloaded: "gamefile.enc", // Filename of the package after being downloaded
        FileDecrypted: "gamefile",      // Filename of the package after being decrypted
    }
}

// Internal helper function to simplify the callback process
function returnValue(value, cb, isfile) {
    // Check if the value is a path and create
    // the(containing) folder if it doesn't exist'
    if (isPath(value)) {
        var dir = value;
        if (fs.existsSync(value) && fs.lstatSync(value).isFile()) {
            dir = path.dirname(value);
        }

        if (!isfile) {
            fs.ensureDirSync(dir);
        }
    }

    // Standard callback
    if (cb != null) { cb(null, value); }

    return value;
}

// TODO: Return different paths for each game in order to not fck things up once LTE is out
var LocationManager = function () {
    var _this = this;
    var { GameInfo } = require('./GameManager.js');
    this.get = {
        InstallationFolder: function (cb) { // TODO: Soon deprecated, use GameFolder instead
            return returnValue(GameInfo.get("lxp").InstallationFolder, cb);
        },
        GameFolder: function (Id, cb) {
            // TODO: Add error handling
            return returnValue(GameInfo.get(Id).InstallationFolder, cb);
        },
        DolphinExecutable: function (Id, cb) {
            // TODO: Linux/Mac support
            // TODO: Make constant
            return returnValue(path.join(GameInfo.get(Id).InstallationFolder, LocationConstants.Folders.DolphinFolder, "Dolphin LXP- [Performance].exe"), cb);
        },
        // TODO: Remove this and replace it with GameFolder or TempFolder
        DownloadFolder: function (Id, cb) {
            return returnValue(path.join(_this.get.GameFolder(Id), Constants.AppName, LocationConstants.Folders.Download), cb);
        },
        ModBasePath: function (Id, cb) {
            return returnValue(path.join(_this.get.GameFolder(Id), LocationConstants.Folders.ModBasePath), cb);
        },
        DowngradeBasePath: function (Id, cb) {
            return returnValue(path.join(_this.get.GameFolder(Id), LocationConstants.Folders.DowngradeBasePath), cb);
        },
        IsoLocation: function (cb) {
            return returnValue(settings.get(Constants.Settings.BrawlIsoLocation));
        },
        TempFolder: function (cb) {
            // TODO: Change to settings
            return returnValue(/*settings.get('input_temp') || */path.dirname(_this.get.IsoLocation()));
        },
        // TODO: Change this to a location the user can choose
        ExtractedBrawlLocation: function (cb) {
            return returnValue(path.join(_this.get.TempFolder(), LocationConstants.Folders.BrawlFolder), cb);
        },
        // TODO: Remove (No idea why I wrote this, better check before removing the DolFolder)
        DolFolder: function (Id, cb) {
            return returnValue(path.join(_this.get.GameFolder(Id), LocationConstants.Folders.DolFolder), cb);
        },
        DolLocation: function (cb) {
            return returnValue(path.join(_this.get.ExtractedBrawlLocation(), LocationConstants.Folders.DolLocation), cb);
        },
        BlackList: function (Id, cb) {
            return returnValue(path.join(_this.get.GameFolder(Id), LocationConstants.Folders.BlackList), cb, true);
        },
        LogFolder: function (cb) {
            return returnValue(path.join(LocationConstants.Folders.Log), cb);
        },
        WitLocation: function (Id, cb) {
            var ret;
            var OperatingSystem = checkOs();
            if (OperatingSystem != Constants.OS.Unsupported) {
                ret = path.join(_this.get.GameFolder(Id), LocationConstants.Folders.Tools.Wit, Constants.Tools.Wit[OperatingSystem]);
            }
            return returnValue(ret, cb, true);
        }
    }

    // Checks if a file is a package
    this.isPackage = function (filename, cb) {
        return returnValue((path.extname(filename) == LocationConstants.Extensions.DownloadedPackage), cb);
    }
    this.isDecrypted = function (filename, cb) {
        return returnValue((path.extname(filename) == LocationConstants.Extensions.DecryptedPackage), cb);
    }
    this.removeExtension = function (filename, cb) {
        return returnValue(filename.substring(0, filename.length - path.extname(filename).length), cb);
    }
}
/*
var LocationManager = {
    get: {
        InstallationFolder: function (cb) {
            return getPath(UI.InstallationFolder, cb);
        },
        DownloadFolder: function (cb) {
            return getPath(path.join(UI.InstallationFolder, Constants.AppName, LocationConstants.Folders.Download), cb);
        },
        ExtractedBrawlLocation: function (cb) {
            console.log(UI.Token);
            return getPath(path.join(UI.ExtractedBrawlLocation, Constants.AppName, LocationConstants.Folders.Download), cb);
        },
        WitLocation: function (cb) {
            var ret;
            var OperatingSystem = checkOs();
            if (OperatingSystem != Constants.OS.Unsupported) {
                ret = path.join(InstallationFolder, LocationConstants.Folders.Tools.Wit, OperatingSystem, Constants.Tools.Wit.Windows);
            }
            return getPath(ret, cb);
        }

    },

    // Checks if a file is a package
    isPackage: function (filename) {
        return (path.extname(filename) == LocationConstants.Extensions.DownloadedPackage);
    },
    isDecrypted: function (filename) {
        return (path.extname(filename) == LocationConstants.Extensions.DecryptedPackage);
    },
    removeExtension: function (filename) {
        return filename.substring(0, filename.length - path.extname(filename).length);
    }
}
*/

module.exports = {
    LocationConstants,
    LocationManager,
    getLocationManager
};