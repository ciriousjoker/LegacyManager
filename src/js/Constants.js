// Constants
// ================

'use strict';

const path = require('path');

// TODO: Move paths into Pathmanager
// TODO: Add use cases for every constant
// TODO: Combine all project settings into a ProjectManager.js module

var Constants = {};

Constants.AppName = "LegacyManager";
Constants.PATCH_TMP_FOLDER = "SSBB";
Constants.DownloadFolder = "_dl";
Constants.LogFolder = "_log";
Constants.Encryption = {
    HashIterations: 10000
}
Constants.Game = {
    BRAWL_ISO_CODE: "RSBE01",
    GAME_SHORT: {
        XP: "lxp",
        TE: "lte",
        DEFAULT: "lxp"
    },
    GAME_CODE: {
        XP: "RSBEXP",
        TE: "RSBEXP"
    },
    GAME_NAME: {
        XP: "Super Smash Bros. Legacy XP",
        TE: "Super Smash Bros. Legacy TE",
    },
    GAME_EXT: {
        XP: ".wbfs"
    }
};
Constants.OS = {
    Windows: "win",
    Mac: "mac",
    Linux: "linux",
    Unsupported: "unsupported"
};
Constants.Regex = {
    OSDetection: {
        Windows: /^win/,
        Mac: /^darwin/,
        Linux: /^linux/
    },
    WitProcessing: {
        IsStatus: /\d{1,3}\b%.*/,
        HasETA: /ETA (.[^ ])*/
    },
    ZipProcessing: {
        IsStatus: /\d{1,3}\b%.*/,
        HasPath: /- (.)*/
    }
};
// TODO: Rename the keys to something more appropriate
Constants.Keys = {
    Cancelled: "cancelled",
    HashtableLocal: 'hashtable_local_'
};
Constants.TmpFilePrefix = ".1x9m3tb19g_";
Constants.UI = {
    Input: {
        Server: "input_server",
        Token: "input_token",
        BrawlIsoLocation: "input_brawl_iso",
        [Constants.Game.GAME_SHORT.XP]: {
            Folder: "input_folder_installation_lxp"
        },
        [Constants.Game.GAME_SHORT.TE]: {
            Folder: "input_folder_installation_lte"
        },
        XP: { // TODO: Remove this
            Server: "input_folder_installation_lxp"
        },
        TE: { // TODO: Remove this
            Server: "input_folder_installation_lte"
        }
    }
};
Constants.Settings = {
    BrawlIsoLocation: "iso_location",
    StatusTrayExpanded: "statustray_expanded",
    GameInfoPrefix: "game_",
    PasswordLegacyXP: "password_lxp"
};
Constants.Progress = {
    Prefix: "progress_",
    Total: "progress_total",
    Current: "progress_current",
    Modes: {
        Buffering: "buffer",
        Indeterminate: "indeterminate",
        Determinate: "determinate"
    },
    BufferedStepSize: 5,
    BufferedStepSizeSmall: 5,
    BufferedStepSizeSmallest: 1,
    Percentages: {
        IndexingHashtable: 2,
        CheckingDistinctUrls: 96,
        IndexingDistinctHashtable: 2
    },
    Status: {
        WitExtraction: "Extracting the .iso",
        ZipExtraction: "Extracting the game files",
        BuildPatchedWbfs: "Building the patched .wbfs"
    },
    Durations: {
        CheckIfCancelled: 500
    }
};
// Constants used to map github projects to the local project id
Constants.Projects = {
    [Constants.Game.GAME_SHORT.XP]: {
        ProjectName: "legacy-xp-public" //legacyxp testproject legacy-xp-public.git
    },
    [Constants.Game.GAME_SHORT.TE]: {
        ProjectName: "testproject"
    },
    Git: {
        User: "git",
        BranchLocal: "master",
        BranchRemote: "origin/master"
    }
};
Constants.Animation = {
    Duration: {
        StatusTrayFade: {
            duration: "slow",
            easing: "easeOutQuint"
        },
        TimoutAt100Percent: 1700
    }
};
Constants.Threading = {
    StatusTrayUpdate: "parseHashtable-update",
    ParseHashtableStart: "parseHashtable-start",
    ParseHashtableResponse: "parseHashtable-response",
    ParseHashtableCancel: "parseHashtable-cancel",
    ParseHashtableCancelResponse: "parseHashtable-cancel-response"
};
Constants.Tools = {
    Wit: {
        [Constants.OS.Windows]: path.join("Windows", "wit.exe"),
        [Constants.OS.Mac]: path.join("Mac", "wit"),
        [Constants.OS.Linux]: path.join("Linux", "wit"),
        ReturnCode: {
            Dolpatch: {
                OK: 5
            },
            BuildPatchedWbfs: {
                OK: 0
            }
        }
    }
}


module.exports = {
    // Constants
    Constants
};