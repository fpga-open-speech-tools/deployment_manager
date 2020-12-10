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
    ui.name = model.system.name || "Project"
    ui.description = model.system.description || ""
    ui.data = []
    ui.containers = []
    ui.views = []
    ui.options = []
    numOfRegsRead = 0
    
    let dataIndex = 0, optionsLength = 0;

    model.devices.forEach(device => {
        if(device.description){
            let deviceDescriptionData = {
                name: `${device.name} description`,
                value: device.description,
                type: "user-only",
                device: device.name,
                properties: {
                    min: 0,
                    max: 0,
                    step: 0
                }
            }
            dataIndex = ui.data.push(deviceDescriptionData) - 1
            let deviceDescriptionView = createView(`${device.name} Description`, "Text", "default", [dataIndex], [])
            addViewToContainer(ui, deviceDescriptionView, device.name)
            dataIndex = dataIndex + 1
        }

        device.registers.forEach(reg => {
            let [uiReg, option] = createData(device, reg, dataIndex)

            dataLength = ui.data.push(uiReg)
            let options = []
            if(option){
                optionsLength = ui.options.push(option)
                options = [optionsLength - 1]
            }

            if (uiReg.type == 'dpr') {
                return;
            }

            let [viewType, viewVariant] = getViewType(uiReg)
            let view = createView(uiReg.name, viewType, viewVariant, [dataIndex], options)
            addViewToContainer(ui, view, device.name)

            dataIndex = dataLength
        });

    });
    return ui
}

let createData = (device, reg, index) => {
    let properties = {}
    let option = null;
    if(reg.dataType.wordLength == 1){
        properties = {
            enumeration: ["Disable", "Enable"]
        }
    }
    else if(reg.enumerations){
        option = {
            data: [index],
            enumerations: Object.keys(reg.enumerations).map(key => {
                let result = {
                    "key": key,
                    "value": reg.enumerations[key]
                }
                return result
              })
        }
        properties = {enumerations: []}
        
    }
    else {
        const {min, max, step} = getMinMaxStep(reg.dataType)
        properties = {
            min: min,
            max: max,
            step: step
        }
    }
    let type = "register"
    if (reg.dataType.dpram){
        type = "dpr"
    }

    uiReg = {
        name: reg.name,
        type: type,
        device: device.name,
        value: reg.defaultValue,
        properties
    }
    return [uiReg, option]
}

let getMinMaxStep = function(reg) {
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

let getViewType = (input) => {
    if(Array.isArray(input) && input.length == 2)
        return ["TwoHandleSlider", "standard"]
    if(input.min == 0 && input.max == 1 && input.step == 1 || (input.properties && input.properties.enumeration))
        return ["Toggle", "standard"]
    if(input.properties && input.properties.enumerations)
        return ["RadioToggle", "standard"]
    return ["Slider", "horizontal"]
}

let createView = (name, viewType, variant, references, optionsIndex)  => {
    return {"name": name,
        "type":{
            "component": viewType,
            "variant": variant
        },
        "references": references,
        "optionsIndex": optionsIndex
    }
}

let addViewToContainer = (ui, view, containerName) => {
    let containerIndex = ui.containers.findIndex(container => container.name == containerName);

    if(containerIndex == -1){
        let container = {
            name: containerName,
            views: []
        }
        containerIndex = ui.containers.push(container) - 1;
    }

    let viewIndex = ui.views.indexOf(view);
    if(viewIndex == -1){
        viewIndex = ui.views.push(view) - 1;
    }

    if(ui.containers[containerIndex].views.indexOf(viewIndex) == -1  ) {
        ui.containers[containerIndex].views.push(viewIndex);
    }
}

exports.addViewToContainer = addViewToContainer;
exports.createView = createView;
exports.getViewType = getViewType;