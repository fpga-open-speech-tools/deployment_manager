const utils = require('../utilities')
const dpram = require('../dpram')

console.log('Testing model.json with DPRAM')
console.log('Model.json used: dpramModel.json')
console.log('Output file: dpram_ui.json')
let model = utils.loadJsonFile('./dpramModel.json')

let ui = utils.convertModelJsonToUIJson('./dpramModel.json')

dpram.parse(model, ui, "./config/")

utils.saveJsonFile('./dpram_ui.json', ui)


