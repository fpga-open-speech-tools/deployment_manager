'use strict';

const util = require('./utilities.js');

const SCRIPT_PATH = "../utils/runtime_config"

exports.downloadAndInstall = function(s3bucket, s3dir, configPath) {
    return new Promise((resolve, reject) => {

        let errors = [];
        let registerPaths = {};


        const { spawn } = require("child_process");
        let downloadProc = spawn('python3', [SCRIPT_PATH + '/aws_overlay_installer.py', '-b', s3bucket, '-d', s3dir]);

        downloadProc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        downloadProc.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            errors.push(data)
        });

        // TODO: errors on stderr right now aren't actually problematic; 
        //       improve this error handling
        downloadProc.on('close', (code) => {
            console.log(`exit code: ${code}`);
            if (errors) {
                // console.log(errors.toString());
                // reject({code, errors});
                if (code == 0) {
                    resolve({code});
                }
                else {
                    reject({code});
                }
            }
            else {
                resolve({code});
            }
        });
    });
}

exports.remove = function(projectName) {
    const { exec } = require('child_process')

    let cmd = './' + SCRIPT_PATH + '/overlaymgr remove ' + projectName;
    exec(cmd, util.execCB);
    cmd = './' + SCRIPT_PATH + '/drivermgr remove ' + projectName;
    exec(cmd, util.execCB);
}

// TODO: the intent here is to separate out the download and installation processes;
//       install can then be used to install local/cached projects
exports.install = function(projectName) {

}

exports.download = function(projectName) {

}
