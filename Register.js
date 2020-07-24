'use strict';

const util = require('./utilities.js');
const fs = require('fs');

const deviceLocation = "/sys/class";
const fe = "/fe_";

function createDevicePath (moduleName, majorNumber) {
    const filepath = deviceLocation
        + fe + moduleName.trim() + '_' + majorNumber
        + fe + moduleName.trim() + '_' + majorNumber;
    // console.log(`device path created: ${filepath}`);
    return filepath;
};

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
};

exports.write = function(device, name ,value) {
    return new Promise((resolve, reject) => {
        // console.log(device, name, value);

        let errors = [];

        try {
            // construct the path the to register file
            // XXX: this will likely change once we finish designing our configuration file format
            // XXX: we really shouldn't construct the path every time we do a write; suboptimal performance
            const majorNumber = findMajorNumber(device);
            const devicePath = createDevicePath(device, majorNumber);
            const registerPath = devicePath + "/" + name;

            // console.log(registerPath);

            fs.writeFile(registerPath, value, (err) => {
                if (err) 
                {
                    throw err;
                }
            });
            
        } 
        catch (error) {
            errors.append(error);
        }

        if (errors && errors.length) {
            console.log('error write');
            reject({errors});
        } 
        else {
            // TODO: what to return on success?
            // console.log('success write');
            resolve({});
        }

    });

}