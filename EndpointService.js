'use strict';

const util = require('./utilities.js');
const overlayManager = require('./FpgaOverlayManager')
const fs = require('fs');
const ModelController = require('./ModelController.js');
const ModelDataClient = require('./ModelDataClient.js');
const dpram = require('./dpram')
const { spawn } = require("child_process");

const configPath = "../config"

var previousProjectName; 

var cp;

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

            if(cp != null){
                modelDataClient.
                cp.kill(9);
                cp = null;
            }

            var downloadPromise = overlayManager.downloadAndInstall(CommandObject.bucketname, CommandObject.downloadurl, configPath);

            downloadPromise.then((result) => {
                let status = "success"
                res.statusCode = 200;

                

                if (!fs.existsSync('../config/ui.json') ) {
                    if(fs.existsSync('../config/model.json')){
                        let ui = util.convertModelJsonToUIJson('../config/model.json')
                        let model = util.loadJsonFile('../config/model.json')
                        
                        if(dpram.hasDPRAM(model)){
                            dpram.parse(model, ui)
                        }

                        ui.data.forEach((datum, index) => {
                            if(datum.connection){
                                if(datum.connection.type == "ws"){
                                    if(datum.connection.file){
                                        let driverpath = '../config/' + datum.connection.file;
                                        fs.chmodSync(driverpath, '0775')
                                        cp = spawn(driverpath, [])
                                        cp.stdout.on('data', (data) => {
                                            console.log(`stdout: ${data}`);
                                        });
                                        cp.on('close', () => {
                                            console.log("Process closed");
                                            cp = null; 
                                        });
                                    }
                                    modelDataClient.addDataSource(datum.connection.port, index);
                                }
                            }
                        });

                        ModelController.setModelConfig(ui)
                    }
                    else {
                        status = "no configuation";
                        res.statusCode = 400
                    }
                }
                console.log(status)
                // TODO: the FpgaOverlayManager should know about the previous project it loaded, so it can
                //       handle removing overlays by itself. 
                previousProjectName = CommandObject.projectname.replace('-', '_');

                
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
            result.setHeader('Content-Type', 'application/json');
            result.end(JSON.stringify(ModelController.getConfiguration()))
        } catch (error) {
            console.error(error);
            result.statusCode = 500;
            result.end();
        }
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

exports.addDataSource = (req, res) => {
    const query = url.parse(req.url, true).query;
    let dataIndex = ModelController.getReferenceByName(query.name);
    modelDataClient.addDataSource(query.port, dataIndex);
    res.statusCode = 200;
    res.end();
}
