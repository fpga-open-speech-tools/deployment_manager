'use strict';

const util = require('./utilities.js');
const overlayManager = require('./FpgaOverlayManager')
const fs = require('fs');
const ModelController = require('./ModelController.js');
const ModelDataClient = require('./ModelDataClient.js');

const configPath = "../config"

var previousProjectName; 

var registerPaths = {};

var CommandObject;

var modelDataClient;

exports.Init = function () {
    return;
};

exports.setModelData = function (request, result) {
    let body = '';

    request.on('data', function (chunk) {
        body += chunk;
    });

    request.on('end', () => {
        try {
            const dataPackets = JSON.parse(body);
            
            const promise = ModelController.setData(dataPackets);
            promise.then((fulfilledResult) => {
                // console.log("successfully set model data");

                result.status = 200;
                result.end();

            }, (rejectedResult) => {
                // TODO: error handling
                console.error(rejectedResult);

                // XXX: is this the most appropriate status code?
                result.status = 400;
                result.end();
            });

        } catch (error) {
            
        }
    });
};

exports.getModelData = function(request, result) {
    ModelController.getData();
};


exports.setDownloadRequest = function (req, res) {
    let body = '';

    req.on('data', function (chunk) {
        body += chunk;
    });

    req.on('end', function () {

        try {
            let postBody = JSON.parse(body);
            CommandObject = postBody;

            // previous overlay needs to be removed before loading in a new one
            if (previousProjectName) {
                overlayManager.remove(previousProjectName);
            }

            var downloadPromise = overlayManager.downloadAndInstall(CommandObject.downloadurl, configPath);

            downloadPromise.then((result) => {
                console.log("success");

                // TODO: the FpgaOverlayManager should know about the previous project it loaded, so it can
                //       handle removing overlays by itself. 
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


exports.setConfiguration = function (request, result) {
    let body = '';

    request.on('data', (chunk) => {
        body += chunk;
    });

    request.on('end', () => {
        try {
            const newConfig = JSON.parse(body);
            ModelController.setConfiguration(newConfig);
            result.statusCode = 200;
        } catch (error) {
            console.error(error);
        }

        result.end();
    });
};

exports.getConfiguration = function (request, result) {
    try {
        const configuration = ModelController.getConfiguration();
        result.statusCode = 200;
        result.setHeader('Content-Type', 'application/json');
        result.end(JSON.stringify(configuration));
    } catch (error) {
        console.error(error);
    }
};

exports.connectSignalR = function(request, result) {
    let connectionStatus = {rtcEnabled: false};
    const port = 5000;

    try {
        let address = request.connection.remoteAddress;
        console.log(address);

        if (modelDataClient) {
            console.log(modelDataClient.connected)
            if(modelDataClient.connected){
                console.log('already connected');
                result.statusCode = 200;
                connectionStatus.rtcEnabled = true;
            }
            else {
                console.log('model data client not connected')
                modelDataClient = new ModelDataClient(`http://${address}:${port}/model-data`, 
                    false, ModelController.setData);
                modelDataClient.startSession();

                result.statusCode = 200;
                connectionStatus.rtcEnabled = true;
            }
        }
        else {
            console.log('model data client undefined')
            modelDataClient = new ModelDataClient(`http://${address}:${port}/model-data`, 
                false, ModelController.setData);
            modelDataClient.startSession();

            result.statusCode = 200;
            connectionStatus.rtcEnabled = true;
        }
    }
    catch (error) {
        // TODO: throw error from ModelDataClient when the url is bad and it doesn't connect,
        // or maybe just check modelDataClient.connected instead of using try/catch? 
        result.statusCode = 400;
        console.log(error);
    }

    result.setHeader('Content-Type', 'application/json');
    result.end(JSON.stringify(connectionStatus));
};

exports.invalidRequest = function (req, res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Invalid Request');
};
