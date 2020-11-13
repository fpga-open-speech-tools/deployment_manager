const utils = require('./utilities.js');
const fs = require('fs');
const { config } = require('process');

let parse = (model) => {
    model.devices.forEach(device =>{
        let dprams = findDPRAM(device);

        dprams.forEach(dpram =>{
            filename = dpram.name + ".json";
            if(fs.existsSync(filename)){
                config = util.loadJsonFile(filename)
            }
            else{
                //TODO: Insert Error view when no config is found for DPRAM
                errorView = {}
                addInputToPanel(model, errorView, group);
                continue;
            }

            if(!validate(config)){
                //TODO: Insert Error view when config is invalid
                errorView = {}
                addInputToPanel(model, errorView, group);
                continue;
            }

            config.groups.forEach(group =>{
                config.inputs.forEach(input => {
                    addInputToPanel(model, input, group);
                });
            })
            addButton(model, config.function);
        });
    });

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