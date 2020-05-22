// 'use strict';

const url = require('url');
const fs = require('fs');

const deviceLocation = "/sys/class";
const fe = "/fe_";

const downloadScriptPath = "../utils"
const configPath = "../config"

var previousProjectName; 

var registerPaths = {};

var downloadProc;
var LinkerObject;


var CommandObject;
var progress = '{"progress": 0, "status": ""}';
// UIrawdata = fs.readFileSync('UI.json');
// UIObject = JSON.parse(UIrawdata);

exports.Init = function () {
    return;
}



function createDevicePath (moduleName, majorNumber) {
    // console.log("hi");
    // var targetDriver = LinkerObject[cmdObj.module];
    // //var targetName = cmdObj.module.ToString();
    // var links = targetDriver['links'];
    // console.log('asdf');
    // var majorNo = findMajorNumber(cmbObj.module
    const filepath = deviceLocation
        + fe + moduleName.trim() + '_' + majorNumber
        + fe + moduleName.trim() + '_' + majorNumber;
    // console.log('Command Prepared.' + filepath);
    return filepath;
}

function findMajorNumber (moduleName) {
    // TODO: error handling; if module is not installed, the grep | cut command will return an empty string. We need to make sure that the returned major number is indeed an integer
    // console.log('hello');
    const { execSync } = require('child_process');
    const cmd = 'ls /sys/class | grep -P "fe_' + moduleName + '_\\d+" | cut -d _ -f 3';
    // console.log(cmd);
    const majorNumber = execSync(cmd);
    // console.log(majorNumber)
    // console.log(majorNumber.toString().trim());
    return majorNumber.toString().trim();
}

function mapLinkNamesToFilepaths () {
    registerPaths = {};
     
    // TODO: naming consistency between module and device (they refer to the same thing here)

    for (const device in LinkerObject) {
        if (LinkerObject.hasOwnProperty(device)) {
            const deviceObject = LinkerObject[device];
            const links = deviceObject['links'];

            registerPaths[device] = {};

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
}

function loadLinker() {
    LinkerObject = getJsonFromFile(configPath + '/Linker.json');
    mapLinkNamesToFilepaths();
}

const getJsonFromFile = function (filepath) {
    fs.open;
    // console.log(configPath + '/UI.json')
    // fs.readFile(configPath + '/UI.json','utf-8',(err,data) => {
    //     // console.log(data)
    //     if(err){throw err;}
    //     UIObject = JSON.parse(data);
    //     console.log(JSON.stringify(UIObject));
    // });
    const objFromFile = fs.readFileSync(filepath,
        { encoding: 'utf-8', flag: 'r' })
    fs.close;

    return JSON.parse(objFromFile);
}

function downloadInstallOverlay (s3dir) {
    return new Promise((resolve, reject) => {

        let errors = [];

        // any unix based command
        // var cmdToLaunch = downloadScriptPath + "/aws_overlay_installer.py -p json -b nih-demos -d " + CommandObject.downloadurl;
        // console.log(cmdToLaunch)

        const { spawn } = require("child_process");
        let downloadProc = spawn('python3', [downloadScriptPath + '/aws_overlay_installer.py', '-e', 'http://127.0.0.1:3355/set-download-progress', '-b', 'nih-demos', '-d', s3dir]);

        downloadProc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            if (data.toString().charAt(0) === '{') {
                // progress = JSON.parse(data);
                // console.log(data.toString());
           }
        });

        downloadProc.stderr.on('data', (data) => {
            // console.log(`stderr: ${data}`);
            errors.push(data)
        });

        // TODO: errors on stderr right now aren't actually problematic; 
        //       improve this error handling
        downloadProc.on('close', (code) => {
            console.log(`exit code: ${code}`);
            if (errors) {
                console.log(errors.toString());
                // reject({code, errors});
                if (code == 0) {
                    console.log('code is 0');
                    loadLinker();
                    resolve({code});
                }
            }
            else {
                loadLinker();
                resolve({code});
            }
        });



    });
}

function removePreviousOverlay () {
    const { exec } = require('child_process')

    let cmd = './' + downloadScriptPath + '/overlaymgr remove ' + previousProjectName;
    exec(cmd, execCB);
    cmd = './' + downloadScriptPath + '/drivermgr remove ' + previousProjectName;
    exec(cmd, execCB);
}

loadLinker();

const execCB = function (error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
}
const progressCB = function (error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log('progress receipt: ' + stdout)
    progress = JSON.parse(stdout.substring(1))
    // if (stdout.charAt(0) == 'j') {
    // }
    // else if (stdout.charAt(0) == 'c') {
    //     console.log('done!')
    // }
}

exports.setCommandRequest = function (req, res) {
    // console.log('New Command Received.');
    let body = [];

    // console.log('New Command Received.');
    req.on('data', function (chunk) {
        body.push(chunk);
    });

    // console.log('New Command Received.');
    req.on('end', function () {

    // console.log('New Command Received.');
        try {
            // console.log('asdf');
            postBody = JSON.parse(body);
            // console.log('asdf');
            CommandObject = postBody;
            // console.log('asdf');
            

            // console.log(CommandObject)

            // var majorNumber = findMajorNumber(CommandObject.module);
            // console.log(majorNumber);
            // var echoFile = findEchoFileFromLinker(CommandObject);
            // console.log(echoFile);
            //console.log('\nExpected echo path: ', echoFile)

            // console.log('asdfasdf');
            console.log(registerPaths);

            echoFile = registerPaths[CommandObject.module][CommandObject.link];

            console.log(echoFile);

            var exec = require('child_process').exec;

            // any unix based command
            var cmdToLaunch = "echo " + CommandObject.value + " > " + echoFile;
            //var cmdToLaunch = "echo 12.00 > /sys/class/fe_bitcrusher_248/fe_bitcrusher_248/bits";

            console.log('Command: ', cmdToLaunch);

            var app = exec(cmdToLaunch, execCB);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(CommandObject));

        }
        catch (error) {
            //Do Nothing ;)
            console.error(error);
        }
    });
};



exports.getUIRequest = function (req, res) {
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.query.name) {
        name = reqUrl.query.name
    }

    const UIObject = getJsonFromFile(configPath + '/UI.json')

    // console.log(JSON.stringify(UIObject));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(UIObject));
};

exports.invalidRequest = function (req, res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Invalid Request');
};

exports.setDownloadRequest = function (req, res) {
    //console.log('New Command Received.');
    let body = '';

    req.on('data', function (chunk) {
        body += chunk;
    });

    req.on('end', function () {

        try {
            postBody = JSON.parse(body);
            CommandObject = postBody;

            // previous overlay needs to be removed before loading in a new one
            if (previousProjectName) {
                removePreviousOverlay();
            }

            // reset progress back to 0 before downloading
            progress = '{"progress": 0, "status": ""}';

            var downloadPromise = downloadInstallOverlay(CommandObject.downloadurl);

            downloadPromise.then((result) => {
                console.log("success");

                previousProjectName = CommandObject.projectname.replace('-', '_');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(CommandObject));
            }, (result) => {
                console.log("failure");
                // TODO: send back something else one failure
            });

            

        }
        catch (error) {
            console.error(error);
            //Do Nothing ;)
        }
    });
};

exports.getDownloadProgress = function (req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(progress);
};

exports.setDownloadProgress = function (req, res) {
    let body = '';

    req.on('data', function (chunk) {
        body += chunk;
    });

    req.on('end', () => {
        progress = body;
        // console.log(progress);

        res.statusCode = 200;
        // res.setHeader('Content-Type', 'application/json');
        res.end();
    });
}
