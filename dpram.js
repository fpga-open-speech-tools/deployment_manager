const utils = require('./utilities.js');
const fs = require('fs');

let parse = (model, ui) => {
    model.devices.forEach(device =>{
        let dprams = findDPRAM(device);
        let config = {}
        dprams.forEach(dpram =>{
            let filename = "../config/" + dpram.name + ".json";
            if(fs.existsSync(filename)){
                config = utils.loadJsonFile(filename)
            }
            else{
                errorView = createView(`No config found for ${dpram.name} DPRAM, expected to find ${filename}`, "Text", "default", [], [])
                addViewToContainer(ui, errorView, dpram.name);
                return;
            }

            if(!validate(config)){
                errorView = createView(`Invalid config for ${dpram.name} DPRAM`, "Text", "default", [], [])
                addViewToContainer(ui, errorView, dpram.name);
                return;
            }

            let processingButtonReferences = []

            config.groups.forEach((group, groupIndex) =>{
                config.inputs.forEach(input => {
                    let [references, optionsIndex] = addData(ui, device, input, groupIndex)
                    let [viewType, viewVariant] = getViewType(input)
                    //let (references, optionsIndex) = getData(ui, input);
                    let inputName = input.name
                    if(Array.isArray(input))
                        inputName = input.map(x => x.name).join("_")

                    let view = createView(group + "_" + inputName, viewType, viewVariant, references, optionsIndex)

                    addViewToContainer(ui, view, group);
                    processingButtonReferences = processingButtonReferences.concat(references)
                });
            });

            let [references, ] = getData(ui, dpram);

            processingButtonReferences = references.concat(processingButtonReferences)

            let option = createProcessingOption(ui, config, processingButtonReferences)
            let optionIndex = addOption(ui, option)

            let processingButton = createView("Process " + dpram.name, "ProcessingButton", "standard", processingButtonReferences, [optionIndex])
            addViewToContainer(ui, processingButton, "Processing")

            let processingOutputView = createView("Processing Output " + dpram.name, "Text", "standard", references, [])
            addViewToContainer(ui, processingOutputView, "Processing")

            

        });
    });

}

let validate = (dpramConfig) => true;

let getViewType = (input) => {
    if(Array.isArray(input) && input.length == 2)
        return ["TwoHandleSlider", "standard"]
    if(input.min == 0 && input.max == 1 && input.step == 1)
        return ["Toggle", "standard"]
    return ["Slider", "horizontal"]
}

let addOption = (ui, option) => {
    return ui.options.push(option) - 1
}

let addData = (ui, device, input, nameId='') => {
    let references = []
    let optionsIndex = []

    if(Array.isArray(input)) {
        input.forEach((subInput, inputIndex) => {
            [tempRef, tempOpt] = addData(ui, device, subInput, nameId)
            references = references.concat(tempRef)
            optionsIndex = optionsIndex.concat(tempOpt)
            let option
            if(inputIndex == 0){
                option = {
                    data: [tempRef[0]],
                    // This is essentially hardcoding since there is no reason for it to be the next data
                    union: tempRef[0] + 1, 
                }
            }
            else {
                option = {
                    data: [tempRef[0]],
                    noDisplay: true
                }
            }
            
            optionsIndex.push(addOption(ui,option))
        })
        return [references, optionsIndex]
    }

    let dpramRegister = {
        name: (input.name + nameId),
        type: "user-only",
        device: device.name,
        value: input.value,
        properties: {
            min: input.min,
            max: input.max,
            step: input.step
        }
    }
    references.push(ui.data.push(dpramRegister) - 1)
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

let createProcessingOption = (ui, dpram, dpramReferences) => {
    let option = {
        data: [dpramReferences[dpramReferences.length-1]],
        processing: {
            functions: dpram.processing.initFunctions,
            inputs: [],
            output: dpram.processing.output
        }
    }

    dpram.groups.forEach((group, groupIndex) => {
        dpram.processing.groupFunctions.forEach((func) => {
            let tempFunc = {}
            tempFunc.output_name = func.output_name.replace("${index}", groupIndex)
            tempFunc.function = func.function.replace("${index}", groupIndex)
            option.processing.functions = option.processing.functions.concat(tempFunc)
        });
    });

    dpram.processing.inputs.forEach( (input) =>{
        if(!input.name.includes("${index}")){
            option.processing.inputs = option.processing.inputs.concat(input)
            return
        }
        dpram.groups.forEach((group, groupIndex) => {
            let numInputs = (dpramReferences.length - 1) / dpram.groups.length
            let dpramInput = {}
            if(Array.isArray(input.value)){
                dpramInput = dpram.inputs[input.value[0]][input.value[1]]
            }
            else{
                dpramInput = dpram.inputs[input.value]
            }
            let tempInput = {
                name: input.name.replace("${index}", groupIndex),
                type: input.type,
                value: ui.data.findIndex((datum) => datum.name == (dpramInput.name + groupIndex))
            }
            option.processing.inputs = option.processing.inputs.concat(tempInput)
        })
    })

    option.processing.functions = option.processing.functions.concat(dpram.processing.endFunctions)
    return option
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

let hasDPRAM = (model) => {
    let result = false
    model.devices.forEach(device =>{
        let dprams = findDPRAM(device);
        if(dprams.length > 0)
            result = true
    })
    return result
}

exports.parse = parse;
exports.hasDPRAM = hasDPRAM;