// 'use strict';
const fs = require('fs');

exports.execCB = function (error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
}


exports.loadJsonFile = function (filepath) {
    fs.open;
    const objFromFile = fs.readFileSync(filepath, { encoding: 'utf-8', flag: 'r' })
    fs.close;

    return JSON.parse(objFromFile);
}

exports.saveJsonFile = function (filepath, jsonData) {
    fs.open;
    fs.writeFile(filepath, JSON.stringify(jsonData), (err) => {
        if (err) {
            throw err;
        } 
    });
    fs.close;
}