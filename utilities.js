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
    fs.writeFile(filepath, JSON.stringify(jsonData, null, '\t'), (err) => {
        if (err) {
            throw err;
        } 
    });
    fs.close;
}

exports.convertModelJsonToUIJson = function(filepath) {
    model = exports.loadJsonFile(filepath)
    ui = {}
    ui.name = ""
    ui.data = []
    ui.options = []
    numOfRegsRead = 0
    model.devices.forEach(device => {
        device.registers.forEach((reg, index) => {
            let properties = {}
            if(reg.dataType.wordLength == 1){
                properties = {
                    enumeration: ["Disable", "Enable"]
                }
            }
            else if(reg.enumerations){
                option = {
                    data: [index + numOfRegsRead],
                    enumerations: Object.keys(reg.enumerations).map(key => {
                        let result = {
                            "key": key,
                            "value": reg.enumerations[key]
                        }
                        return result
                      })
                }
                properties = {enumerations: []}
                ui.options.push(option)
            }
            else {
                const {min, max, step} = getMinMaxStep(reg.dataType)
                properties = {
                    min: min,
                    max: max,
                    step: step
                }
            }
            
            uiReg = {
                name: reg.name,
                type: "register",
                device: device.name,
                value: reg.defaultValue,
                properties
            }
            ui.data.push(uiReg)
        });
        numOfRegsRead += device.registers.length
    });
    return ui
}

getMinMaxStep = function(reg) {
    intMax = 0
    fracMax = 0
    
    signBits = reg.signed ? 1 : 0
    intBits = reg.wordLength - reg.fractionLength - signBits
    
    step = 1 / Math.pow(2, reg.fractionLength)

    if (reg.fractionLength > reg.wordLength - signBits) {
        actualFracBits =  reg.wordLength - signBits
        min = reg.signed ? Math.pow(2, actualFracBits) / Math.pow(2, reg.fractionLength) : 0
        max = (Math.pow(2, actualFracBits) - 1) / Math.pow(2, reg.fractionLength)
        return {min: min, max: max, step: step}
    }

    if(intBits > 0){
        intMax = Math.pow(2, intBits) - 1
    }
    if(reg.fractionLength > 0){
        fracMax = 1 - 1 / Math.pow(2, reg.fractionLength)
    }
    min = reg.signed ? - (intMax + 1) : 0
    max = intMax + fracMax

    return {min: min, max: max, step: step}
}