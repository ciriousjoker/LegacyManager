// DecryptionManager
// =================




const fs = require('fs-extra');
const path = require('path');
const sync = require('synchronize');


const { Constants } = require('./Constants.js');
const { isdef } = require('./Helpers.js');
const { LocationConstants, LocationManager, getLocationManager } = require('./LocationManager.js');
const { CSharpManager } = require('./CSharpManager.js');

var DecryptionManagerHolder = {};

function getDecryptionManager(id, cb) {
    if (!isdef(DecryptionManagerHolder[id])) {
        DecryptionManagerHolder[id] = new DecryptionManager(id);
    }

    // Standard callback
    if (cb != null) { cb(DecryptionManagerHolder[id]); }

    return DecryptionManagerHolder[id];
}

var DecryptionManager = function (id) {
    var _this = this;
    this.Id = id;

    this.DecryptFile = function (options, cb) {
        sync.fiber(function () {
            var { CSharpManager } = require('./CSharpManager.js');
            if (!sync.await(CSharpManager.DecryptFile(options, sync.defer()))) {
                cb(null, "Error while decrypting: " + path.basename(options.InputFile));
            } else {
                cb(null, "Error while decrypting: " + path.basename(options.InputFile));
            }
        });
    }
}

module.exports = {
    DecryptionManager,
    getDecryptionManager
};