const http = require('http');
const url = require('url');

module.exports = http.createServer((req, res) => {

    const service = require('./service.js');
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname == '/sendCmd' && req.method === 'PUT') {
        console.log('Request Type:' +
            req.method + ' Endpoint: ' +
            reqUrl.pathname);

        service.setCommandRequest(req, res);
    }
    else if(reqUrl.pathname == '/ui' && req.method === 'GET') {
        console.log('Request Type:' +
        req.method + ' Endpoint: ' +
        reqUrl.pathname);
        service.getUIRequest(req, res); 
    } 
    else {
        console.log('Request Type:' +
            req.method + ' Invalid Endpoint: ' +
            reqUrl.pathname);

        service.invalidRequest(req, res);

    }
});