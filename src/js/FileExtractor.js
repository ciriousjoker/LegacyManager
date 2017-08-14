// FileExtractor
// =============


// Extracting 7zip files
const path = require('path');
const child_process = require('child_process');


var { Constants } = require('./Constants.js');
var { isdef, checkOs } = require('./Helpers.js')

var FileExtractorHolder = {};

function getFileExtractor(id, cb) {
    if (!isdef(FileExtractorHolder[id])) {
        FileExtractorHolder[id] = new FileExtractor(id);
    }

    // Standard callback
    if (cb != null) { cb(FileExtractorHolder[id]); }

    return FileExtractorHolder[id];
}

// Progress constants
var Total = Constants.Progress.Total;
var Current = Constants.Progress.Current;

var FileExtractor = function (Id, Progress) {
    var _this = this;
    this.Id = Id;
    this.Progress = Progress;

    this.ExtractFile = function (options, cb) {
        console.log("Options:", options);
        var InputFile = options.InputFile;
        var OutputFolder = options.OutputFolder;
        var Id = options.Id;

        var bin7z = window.require('7zip-bin').path7za;

        if (checkOs() == Constants.OS.Unsupported) {
            // TODO: Change this to constant
            cb("Couldn't determine your OS. Please make sure it's either Windows, Linux or Mac", "Error while extracting the .iso");
            return;
        }

        var bin7zArguments = ['x', "-bt", "-r", '-y', '-bsp1', InputFile, '-o' + OutputFolder];

        

        console.log("Path to execute:", bin7z);
        var bin7znormalized = bin7z.replace("app.asar", "app.asar.unpacked");
        console.log("New path to execute:", bin7znormalized);


        var ExtractProcess = child_process.spawn(bin7znormalized, bin7zArguments);

        var check = Constants.Regex.ZipProcessing;
        //var logfile = path.join(lm.get.LogFolder(), "extract_" + new Date().getTime() + ".log");

        var error = false;

        ExtractProcess.stdout.on('data', function (data) {
            // Convert from buffer to string
            var line = data + "";

            // TODO: Implement log file
            // Log the output
            //fs.appendFile(logfile, line);

            // Examples of a line returned by 7za
            // > Some random intro
            // > 28% 1318 - Some path\with\a\file.extension

            // Allow to cancel this extraction process
            if (_this.Progress.isCancelled()) {
                ExtractProcess.kill('SIGTERM');
                console.log("Killed extraction");
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


                // Extract the progress
                _this.Progress.setProgress(Current, CurrentProgress);

                // Extract the path
                var pathline = check.HasPath.exec(line);
                if (pathline) {
                    var filepath = pathline[0].substring(2);
                    _this.Progress.setStatusSuffix(": " + path.basename(filepath));
                }
            }
        });

        ExtractProcess.stderr.on('data', function (data) {

            // TODO: Implement log file
            //fs.appendFile(logfile, data);
            console.log(data.toString());
            ExtractProcess.kill('SIGTERM');
            error = true;
            cb(null, false);
        });

        ExtractProcess.on('close', function (code) {
            _this.Progress.setStatusSuffix("");
            
            // TODO: Implement log file
            //fs.appendFile(logfile, "wit ended with exit code: " + code);

            if(!error) {
                console.log("Done with extracting the .iso");
                cb(null, true);
            }
        });
    }
}

module.exports = {
    FileExtractor,
    getFileExtractor
};