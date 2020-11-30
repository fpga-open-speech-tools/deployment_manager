const utils = require('./utilities.js');
const fs = require('fs');

let parse = (model, ui) => {
    model.devices.forEach(device =>{
        let dprams = findDPRAM(device);
        let config = {}
        dprams.forEach(dpram =>{
            filename = dpram.name + ".json";
            if(fs.existsSync(filename)){
                config = utils.loadJsonFile(filename)
            }
            else{
                errorView = createView(`No config found for ${dpram.name} DPRAM, expected to find ${filename}`, "Text", "default", [], [])
                addViewToContainer(model, errorView, dpram.name);
                return;
            }

            if(!validate(config)){
                errorView = createView(`Invalid config for ${dpram.name} DPRAM`, "Text", "default", [], [])
                addViewToContainer(model, errorView, dpram.name);
                return;
            }

            config.groups.forEach(group =>{
                config.inputs.forEach(input => {
                    let [references, optionsIndex] = addData(ui, device, input)
                    let [viewType, viewVariant] = getViewType(input)
                    //let (references, optionsIndex) = getData(model, input);
                    let inputName = input.name
                    if(Array.isArray(input))
                        inputName = input.map(x => x.name).join("_")

                    let view = createView(group + "_" + inputName, viewType, viewVariant, references, optionsIndex)

                    addViewToContainer(ui, view, group);
                });
            })
            //addButton(model, config.function);
        });
    });

}

let validate = (dpramConfig) => true;

let getViewType = (input) => {
    if(Array.isArray(input) && input.length == 2)
        return ["Slider", "ranged"]
    if(input.min == 0 && input.max == 1 && input.step == 1)
        return ["Toggle", "default"]
    return ["Slider", "horizontal"]
}

let addData = (model, device, input) => {
    let references = []
    optionsIndex = []

    if(Array.isArray(input)) {
        input.forEach( subInput => {
            [tempRef, tempOpt] = addData(model, device, subInput)
            references = references.concat(tempRef)
            optionsIndex = optionsIndex.concat(tempOpt)
        })
        return [references, optionsIndex]
    }


    let dpramRegister = {
        name: input.name,
        type: "user-only",
        device: device.name,
        value: 0, //TODO: Add default value somewhere
        properties: {
            min: input.min,
            max: input.max,
            step: input.step
        }
    }
    references.push(model.data.push(dpramRegister) - 1)
    return [references, optionsIndex]
}

let getData = (model, input) => {
    let references = []
    optionsIndex = []
    if(Array.isArray(input)) {
        input.forEach( subInput => {
            [tempRef, tempOpt] = getData(model, subInput)
            references = references.concat(tempRef)
            optionsIndex = optionsIndex.concat(tempOpt)
        })
        return [references, optionsIndex]
    }

    references.push(model.data.findIndex(data => data.name == input.name));
    optionsIndex.push(model.options.findIndex(option => option.name == input.name))

    return [references, optionsIndex]
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

let addViewToContainer = (model, input, panel) => {
    let panelIndex = model.containers.findIndex(container => container.name == panel);

    if(panelIndex == -1){
        let container = {
            name: panel,
            views: []
        }
        panelIndex = model.containers.push(container) - 1;
    }

    let viewIndex = model.views.indexOf(input);
    if(viewIndex == -1){
        viewIndex = model.views.push(input) - 1;
    }

    if(model.containers[panelIndex].views.indexOf(viewIndex) == -1  ) {
        model.containers[panelIndex].views.push(viewIndex);
    }
}

let findDPRAM = (device) =>{
    dprams = []
    device.registers.forEach(register =>{
        if(register.dataType.dpram){
            dprams.push(register);
        }
    });
    return dprams;
}

exports.parse = parse;