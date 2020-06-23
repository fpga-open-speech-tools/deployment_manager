// 'use strict';
const fs = require('fs');

const deviceLocation = "/sys/class";
const fe = "/fe_";
const downloadScriptPath = "../utils"

const execCB = function (error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
}

function createDevicePath (moduleName, majorNumber) {
    const filepath = deviceLocation
        + fe + moduleName.trim() + '_' + majorNumber
        + fe + moduleName.trim() + '_' + majorNumber;
    // console.log(`device path created: ${filepath}`);
    return filepath;
}

function findMajorNumber (moduleName) {
    // TODO: error handling; if module is not installed, the grep | cut command will return an empty string. We need to make sure that the returned major number is indeed an integer
    const { execSync } = require('child_process');

    try {
        const cmd = `ls /sys/class${fe}${moduleName}_*  | grep -o '[^_]*$'`;
        const majorNumber = execSync(cmd);
        // console.log(majorNumber.toString().trim());
        return majorNumber.toString().trim();
    } catch (error) {
        // the most likely error to occur is that the desired directory doesn't 
        // exist because the driver hasn't been loaded yet; this is no big deal
        console.log(error.toString());
    }
}

const mapLinkNamesToFilepaths = function(LinkerObject) {
    let registerPaths = {};
     
    // TODO: naming consistency between module and device (they refer to the same thing here)

    for (const device in LinkerObject) {
        if (LinkerObject.hasOwnProperty(device)) {
            const deviceObject = LinkerObject[device];
            const links = deviceObject['links'];

            registerPaths[device] = {};

            // TODO: registerPaths probably shouldn't be populated if the driver isn't loaded. When a driver isn't loaded, we should tell the user about it.
            const majorNumber = findMajorNumber(device);
            const devicePath = createDevicePath(device, majorNumber);

            for (const link in links) {
                if (links.hasOwnProperty(link)) {
                    const registerName = links[link];

                    // XXX: registerName is assumed to have a leading / in the linker json. This should always be the case, but having some error handling would be nice
                    registerPaths[device][link] = devicePath + registerName;
                }
            }
        }
    }
    console.log(registerPaths);
    return registerPaths;
}

const getJsonFromFile = function (filepath) {
    fs.open;
    const objFromFile = fs.readFileSync(filepath,
        { encoding: 'utf-8', flag: 'r' })
    fs.close;

    return JSON.parse(objFromFile);
}

const loadLinker = function(configPath) {
    const LinkerObject = getJsonFromFile(configPath + '/Linker.json');
    const registerPaths = mapLinkNamesToFilepaths(LinkerObject);
    return registerPaths;
}

const downloadInstallOverlay = function(s3dir, configPath) {
    return new Promise((resolve, reject) => {

        let errors = [];
        let registerPaths = {};


        const { spawn } = require("child_process");
        let downloadProc = spawn('python3', [downloadScriptPath + '/aws_overlay_installer.py', '-e', 'http://127.0.0.1:3355/set-download-progress', '-b', 'nih-demos', '-d', s3dir]);

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

const removePreviousOverlay = function(previousProjectName) {
    const { exec } = require('child_process')

    let cmd = './' + downloadScriptPath + '/overlaymgr remove ' + previousProjectName;
    exec(cmd, execCB);
    cmd = './' + downloadScriptPath + '/drivermgr remove ' + previousProjectName;
    exec(cmd, execCB);
}



exports.execCB = execCB;
exports.loadLinker = loadLinker;
exports.getJsonFromFile = getJsonFromFile;
exports.downloadInstallOverlay = downloadInstallOverlay;
exports.removePreviousOverlay = removePreviousOverlay;