'use strict';

const util = require('./utilities.js');

const CONFIG_FILE = 'config.json';

exports.get = function () {
    const config = util.loadJsonFile(CONFIG_FILE);
    return config;
}

exports.set = function (config) {
    util.saveJsonFile(CONFIG_FILE, config);
}