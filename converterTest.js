const utils = require('./utilities')
const dpram = require('./dpram')

let model = utils.loadJsonFile('./model.json')

let ui = utils.convertModelJsonToUIJson('./model.json')

utils.saveJsonFile('./ui-1.json', ui)

dpram.parse(model, ui)

utils.saveJsonFile('./ui.json', ui)