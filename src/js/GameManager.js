// GameManager
// ===========

'use strict';

const fs = require('fs-extra');
const path = require('path');
const isPath = require('is-valid-path');
const settings = require('electron-settings');
const sync = require('synchronize');



var { Constants } = require('./Constants.js');
var { isdef } = require('./Helpers.js')
var { DownloadManager } = require('./DownloadManager.js')
var { DecryptionManager, getDecryptionManager } = require('./DecryptionManager.js');
var { FileExtractor, getFileExtractor } = require('./FileExtractor.js');
var { BuildRoutine } = require('./BuildRoutine.js');
var { LocationConstants } = require('./LocationManager.js');

var FileExtractorHolder = {};

var GameInfoPrefix = Constants.Settings.GameInfoPrefix;
var GameInfoFile = LocationConstants.Filenames.GameInfo;


// Simplified constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;
var Modes = Constants.Progress.Modes;

var GameInfo = {
    default: function (Id) {
        return {
            Id,
            Version: -1,
            VersionString: "v0.0.1",
            InstallationFolder: "",
            Installed: false
        }
    },
    get: function (Id) { },
    save: function (info) {
        if (!isdef(info.Id)) {
            return false;
        }
        settings.set(GameInfoPrefix + info.Id, info);
        return true;
    }
}

GameInfo.get = function (Id) {
    var info = settings.get(GameInfoPrefix + Id);
    // TODO: Error handling when the read Id doesn't match the requested Id
    if (isdef(info)) {
        return info;
    } else {
        return GameInfo.default(Id);
    }
}

var GameManager = function (Progress) {
    var _this = this;
    this.Progress = Progress;

    this.getUpdateInfo = function (Id, cb) {
        sync.fiber(function () {
            var Database = settings.get("offline_db");

            if (!isdef(Database)) {
                var dm = new DownloadManager(_this.Progress);
                Database = sync.await(dm.UpdateDatabase(sync.defer()));
            }

            if (!isdef(Database)) {
                cb(new Error("Couldn't download database"));
                return false;
            }
            var UpdateInfo = Database.game_info[Id];

            console.log(UpdateInfo);

            cb(null, UpdateInfo);
        });
    }

    this.isUpdateAvailable = function (Id, cb) {
        sync.fiber(function () {
            var dm = new DownloadManager(_this.Progress);
            var gm = new GameManager(_this.Progress);
            var game = GameInfo.get(Id);

            var Database = sync.await(dm.UpdateDatabase(sync.defer()));
            var CurrentVersion = gm.isInstalled(Id, sync.defer());


            var VersionData = Database.game_info[Id];
            var LastVersionNumver = VersionData.Releases.length - 1;

            if (!CurrentVersion || CurrentVersion.Version < LastVersionNumver) {
                //console.log("New version available: ", VersionData.Releases[LastVersionNumver].VersionString);
                cb(null, VersionData.Releases[LastVersionNumver]);
                return;
            }

            console.log("Update available: " + LastVersionNumver);

            cb(null, false);
        });
    }

    // Installs the game and returns the version or -1 if unsuccessful
    this.installGame = function (Id, Version, cb) {
        sync.fiber(function () {
            // Imports
            var { LocationConstants, getLocationManager } = require('./LocationManager.js');

            var dm = new DownloadManager(_this.Progress);

            // Currently installed version of the game
            var Game = GameInfo.get(Id);
            console.log("Currently installed: " + Game.VersionString);

            // TODO: Add error handling
            var UpdateInfo = sync.await(_this.getUpdateInfo(Id, sync.defer()));
            var Release = UpdateInfo.Releases[Version];
            var VersionString = Release.VersionString;
            var Url = Release.Url;
            var Size = Release.Size;
            var InstallationFolder = Game.InstallationFolder;

            fs.ensureDirSync(InstallationFolder);

            // Files used in the process
            var FileDownloaded = LocationConstants.Filenames.FileDownloaded;
            var FileDecrypted = LocationConstants.Filenames.FileDecrypted;

            // Other information

            // TODO: Do not hardcode passwords for legacy xp. Remove this once other mods are added.
            //var Password = fs.readFileSync(LocationConstants.Filenames.DefaultPassword).toString();
            var Password = settings.get(Constants.Settings.PasswordLegacyXP);


            // TODO: Add support for patches once out

            // #region Download the game
            _this.Progress.setStatus("Downloading the game files");

            var remotefile = {
                Url,
                Size,
                Filename: FileDownloaded,
                DownloadFolder: InstallationFolder,
                Status: "Downloading the game"
            }
            console.log("Downloading", remotefile);
            var GameFile = sync.await(dm.download(remotefile, sync.defer()));
            console.log("Download result: ", GameFile);
            if(!GameFile.downloaded) {
                _this.Progress.fail();
                cb(null, false);
                return;
            }
            // #endregion Download the game


            // #region Decrypting the package
            _this.Progress.setStatus("Decrypting the game files");
            var decrypt = getDecryptionManager(Id);

            var options = {
                InputFile: path.join(InstallationFolder, FileDownloaded),
                OutputFile: path.join(InstallationFolder, FileDecrypted),
                Password,
                Progress: _this.Progress,
                Id
            };
            // TODO: Improve error handling
            var ResultDecryption = sync.await(decrypt.DecryptFile(options, sync.defer()));
            console.log("Decrypted", ResultDecryption);
            if(!ResultDecryption) {
                _this.Progress.fail();
                cb(null, false);
                return;
            }
            // #endregion Decrypting the package

            // #region Extract the package
            _this.Progress.setStatus(Constants.Progress.Status.ZipExtraction);
            var extractor = new FileExtractor(Id, _this.Progress);// getFileExtractor(Id, _this.Progress);
            var options = {
                InputFile: path.join(InstallationFolder, FileDecrypted),
                OutputFolder: InstallationFolder,
                Id: Id
            };
            var ResultExtraction = sync.await(extractor.ExtractFile(options, sync.defer()));
            console.log("ResultExtraction: ", ResultExtraction);
            if(!ResultExtraction) {
                _this.Progress.fail();
                cb(null, false);
                return;
            }
            // #endregion Extract the package


            // TODO: Download the file
            _this.Progress.setStatus("Building the game");
            var BuildWorked = sync.await(BuildRoutine[Id](Id, _this.Progress, sync.defer()));
            console.log("Build worked: " + BuildWorked);
            if(!BuildWorked) {
                _this.Progress.fail();
                cb(null, false);
                return;
            }


            Game.Id = Id;
            Game.Version = Version;
            Game.VersionString = VersionString;
            Game.Installed = true;

            // Create infofile for later
            var InfoFile = path.join(InstallationFolder, GameInfoFile);
            fs.writeJsonSync(InfoFile, Game.Version);
            GameInfo.save(Game);

            cb(null, Version);
        });
    }

    this.uninstallGame = function (Id, cb) {
        var Game = GameInfo.get(Id);

        var InstallationFolder = Game.InstallationFolder;

        _this.Progress.setStatus("Uninstalling");
        _this.Progress.setMode(Current, Modes.Indeterminate);

        // Remove the game files
        fs.remove(InstallationFolder, function (err) {
            // Reset the game info
            GameInfo.save(GameInfo.default());

            // Reset the progress bar
            _this.Progress.setMode(Current, Modes.Determinate);
            _this.Progress.setStatus("Uninstalled");
            cb(null, err);
        });
    }

    // Returns false or the version of the game given by options.Id
    this.isInstalled = function (Id, cb) {
        console.log("Checking if the game is installed.");
        var game = GameInfo.get(Id);
        if (!isdef(game)) {
            cb(null, false);
            return false;      // TODO: Change to constant "NotInstalled"
        }

        var InstallationFolder = game.InstallationFolder;

        if (!isdef(InstallationFolder)) {
            cb(null, false);
            return false;
        }

        var InfoFile = path.join(InstallationFolder, GameInfoFile);
        if (fs.existsSync(InfoFile) && fs.lstatSync(InfoFile).isFile()) {
            var info = fs.readFileSync(InfoFile).toString();
            // TODO: solve conflict when the .gameinfo file contains different information
            // TODO: Only save a game id in the .gameinfo file so there will
            //       be no conflicts.Either the id matches or it doesnt.
            if (info != game.Version) {
                // TODO: Check for duplicate installation folders during installation (when more than one version is out)
                // TODO: Show a message box: "There seems to be another version of the game installed in the same folder. Do not do this."
            }
            cb(null, game);
            return info;
        } else {
            cb(null, false);
            return false;
        }
    }
}

module.exports = {
    GameManager,
    GameInfo
};