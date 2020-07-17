'use strict';

const merge = require('deepmerge');
const util = require('./utilities.js');

const CONFIG_FILE = 'config.json';

var config = util.loadJsonFile(CONFIG_FILE);

exports.get = function () {
    return config;
}

exports.set = function (newConfig) {
    // console.log(config);
    config = merge(config, newConfig, {arrayMerge : combineMerge});
    // console.log(config);
    util.saveJsonFile(CONFIG_FILE, config);
}

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