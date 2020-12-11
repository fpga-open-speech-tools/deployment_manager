const utils = require('./utilities.js');
const fs = require('fs');

let addViewToContainer = utils.addViewToContainer,
    createView = utils.createView,
    getViewType = utils.getViewType;

let parse = (model, ui) => {
    model.devices.forEach(device =>{
        let dprams = findDPRAM(device);
        let config = {}
        dprams.forEach(dpram =>{
            let filename = dpram.name + ".json"
            let filepath = "../config/" + filename;
            if(fs.existsSync(filepath)){
                config = utils.loadJsonFile(filepath)
            }
            else{
                let errorMsg = `No config found for ${dpram.name} DPRAM, expected to find ${filename}`
                let errorInput = {
                    name: `error ${dpram.name}`,
                    value: errorMsg,
                    min: 0,
                    max: 0,
                    step: 0
                }
                let [references, optionsIndex] = addData(ui, device, errorInput)
                errorView = createView("Error", "Text", "default", [references], [])
                addViewToContainer(ui, errorView, dpram.name);
                return;
            }

            if(!validate(config)){
                let errorMsg = `Invalid config for ${dpram.name} DPRAM`
                let errorInput = {
                    name: `error ${dpram.name}`,
                    value: errorMsg,
                    min: 0,
                    max: 0,
                    step: 0
                }
                let [references, optionsIndex] = addData(ui, device, errorInput)
                errorView = createView("Error", "Text", "default", [references], [])
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
            // let option
            // if(inputIndex == 0){
            //     option = {
            //         data: [tempRef[0]],
            //         // This is essentially hardcoding since there is no reason for it to be the next data
            //         union: tempRef[0] + 1, 
            //     }
            // }
            // else {
            //     option = {
            //         data: [tempRef[0]],
            //         noDisplay: true
            //     }
            // }
            
            // optionsIndex.push(addOption(ui,option))
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
            tempFunc.output_name = func.output_name.replace(/\${index}/g, groupIndex)
            tempFunc.function = func.function.replace(/\${index}/g, groupIndex)
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
            let dataIndex =  ui.data.findIndex((datum) => datum.name == (dpramInput.name + groupIndex));
            let referencesIndex = dpramReferences.findIndex((ref) => ref == dataIndex)
            let tempInput = {
                name: input.name.replace(/\${index}/g, groupIndex),
                type: input.type,
                value: referencesIndex
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