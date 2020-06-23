// 'use strict';

const url = require('url');
const util = require('./utilities.js');
const fs = require('fs');

const configPath = "../config"

var previousProjectName; 

var registerPaths = {};

var CommandObject;
var progress = '{"progress": 0, "status": ""}';

exports.Init = function () {
    return;
}


var registerPaths = util.loadLinker(configPath);


exports.setCommandRequest = function (req, res) {
    let body = [];

    req.on('data', function (chunk) {
        body.push(chunk);
    });

    req.on('end', function () {

        try {
            postBody = JSON.parse(body);
            CommandObject = postBody;
            
            // console.log(registerPaths);
            echoFile = registerPaths[CommandObject.module][CommandObject.link];

            fs.writeFileSync(echoFile, CommandObject.value);

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

    const UIObject = util.getJsonFromFile(configPath + '/UI.json')

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
                util.removePreviousOverlay(previousProjectName);
            }

            // reset progress back to 0 before downloading
            progress = '{"progress": 0, "status": ""}';

            var downloadPromise = util.downloadInstallOverlay(CommandObject.downloadurl, configPath);

            downloadPromise.then((result) => {
                console.log("success");

                registerPaths = result.registerPaths;
                console.log(registerPaths);

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
