'use strict';

const merge = require('deepmerge');
const util = require('./utilities.js');
const Register = require('./Register.js');
const ModelDataClient = require('./ModelDataClient.js');

const CONFIG_FILE = 'config.json';

var modelConfig = util.loadJsonFile(CONFIG_FILE);

// const modelDataClient = new ModelDataClient(false, this.setData);
// modelDataClient.callbacks.incomingDataListener = setData;

exports.getConfiguration = function () {
    return modelConfig;
}

exports.setConfiguration = function (newConfig) {
    // console.log(config);
    modelConfig = merge(modelConfig, newConfig, {arrayMerge : combineMerge});
    // console.log(config);
    util.saveJsonFile(CONFIG_FILE, modelConfig);
}

exports.getData = function () {
    return modelConfig.data;
}

exports.setData = function(dataPackets) {
    return new Promise((resolve, reject) => {

        console.log(dataPackets);

        let errors = [];

        for (const dataPacket of dataPackets) {
            try {
                console.log(dataPacket);
                console.log(dataPacket.index);
                let datum = modelConfig.data[dataPacket.index];
                console.log(datum);
                // console.log(modelConfig);

                if (datum.references[0].type === "register") {
                    const dataWritePromise = Register.write(
                        datum.references[0].device, 
                        datum.references[0].name,
                        dataPacket.value
                    );

                    dataWritePromise.then((fulfilledResult) => {
                        console.log(`successfully wrote ${dataPacket.value} to ${datum.references[0].device} ${datum.references[0].name}`);
                        // data write was successful, so update the shadow in modelConfig
                        datum.value = dataPacket.value;

                    }, (rejectedResult) => {
                        // TODO: error handling
                        console.error(rejectedResult);
                    });
                }
                else {
                    errors.append(`data type ${datum.type} is not supported`);
                }

            } 
            catch (error) {
                console.error(error);
            }
        }

        if (errors && errors.length) {
            reject({errors});
        }
        else {
            // TODO: what to return on success?
            modelDataClient.sendObject(dataPackets);
            resolve({})
        }
    });

};

// merge arrays together instead of concatenating them when merging objects
// taken from the deepmerge documentation
const combineMerge = (target, source, options) => {
    const destination = target.slice()
 
    source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
            destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
        } else if (options.isMergeableObject(item)) {
            destination[index] = merge(target[index], item, options)
        } else if (target.indexOf(item) === -1) {
            destination.push(item)
        }
    })
    return destination
}


var modelDataClient = ModelDataClient.create(false, this.setData);
modelDataClient.startSession();