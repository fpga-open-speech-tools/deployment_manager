const utils = require('./utilities')
const dpram = require('./dpram')

let model = utils.loadJsonFile('./model.json')

let ui = utils.convertModelJsonToUIJson('./model.json')

//dpram.parse(model, ui, "./")
let deviceName = process.argv[2]
ui.data.forEach((datum) => datum.device = deviceName)

utils.saveJsonFile('./multi_device_ui.json', ui)


