'use strict';

const SCRIPT_PATH = "../utils"

exports.downloadAndInstall = function(s3dir, configPath) {
    return new Promise((resolve, reject) => {

        let errors = [];
        let registerPaths = {};


        const { spawn } = require("child_process");
        let downloadProc = spawn('python3', [SCRIPT_PATH + '/aws_overlay_installer.py', '-e', 'http://127.0.0.1:3355/set-download-progress', '-b', 'nih-demos', '-d', s3dir]);

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
                    registerPaths = loadLinker(configPath);
                    resolve({code, registerPaths});
                }
                else {
                    reject({code});
                }
            }
            else {
                registerPaths = loadLinker(configPath);
                resolve({code, registerPaths});
            }
        });
    });
}

exports.remove = function(projectName) {
    const { exec } = require('child_process')

    let cmd = './' + SCRIPT_PATH + '/overlaymgr remove ' + projectName;
    exec(cmd, execCB);
    cmd = './' + SCRIPT_PATH + '/drivermgr remove ' + projectName;
    exec(cmd, execCB);
}

exports.install = function(projectName) {

}