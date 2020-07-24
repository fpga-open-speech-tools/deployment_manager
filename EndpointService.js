'use strict';

const util = require('./utilities.js');
const fs = require('fs');
const ModelController = require('./ModelController.js');

const configPath = "../config"

var previousProjectName; 

var registerPaths = {};

var CommandObject;

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
            // console.log(body);
            // console.log(body.toString());
            // console.log(JSON.parse(body));
            const dataPackets = JSON.parse(body).dataPackets;
            // console.log(body.toJson());
            // const dataPackets = body;
            // console.log(dataPackets);

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

exports.getRegisterConfig = function (req, res) {
    let registers = {"registers": []};

    for (const module in registerPaths) {
        // console.log(module);
        // console.log(registerPaths[module]);

        for (const link in registerPaths[module]) {
            // console.log(link);

            // const value = util.readRegister(module, link)
            registerPath = registerPaths[module][link];
            const value = fs.readFileSync(registerPath, 'utf8').trim();

            registerConfiguration = {
                "module": module, "link": link, "value": value
            };

            // console.log(registerConfiguration);

            registers["registers"].push(registerConfiguration);
        }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(registers));
}

exports.setRegisterConfig = function (req, res) {
    let body = [];
    console.log('in setRegisterConfig');

    req.on('data', function (chunk) {
        body.push(chunk);
    });

    req.on('end', function () {
        console.log(body);

        try {
            registerConfig = JSON.parse(body);
            console.log(registerConfig);

            let UIObject = util.loadJsonFile(configPath + '/UI.json');

            // write all of the registers
            registerConfig['registers'].forEach(register => {
                registerPath = registerPaths[register.module][register.link];
                fs.writeFileSync(registerPath, register.value);        
                // TODO: perform readback so we know that the write worked properly?
            }); 

            // update the register values in the UI config
            UIObject['pages'].forEach(page => {
               page['panels'].forEach(panel => {
                   panel['controls'].forEach(control => {
                       registerConfig['registers'].forEach(register => {
                            if (register.module == control.module && 
                                register.link == control.linkerName) {
                                    control.defaultValue = register.value;
                                    console.log(`set register value ${register.value} for control ${control.linkerName}`);
                                }
                       });
                   });
               }); 
            });

            res.status = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(UIObject));
        }
        catch(error) {
            res.status = 500
            // TODO: error handling and correct return code?
            console.error(error);
        }
   });
}

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

exports.invalidRequest = function (req, res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Invalid Request');
};