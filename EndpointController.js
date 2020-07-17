const http = require('http');
const url = require('url');
const service = require('./EndpointService.js');

module.exports = http.createServer((request, result) => {
    const reqUrl = url.parse(request.url, true);

    console.log('Request Type:' + request.method +
        ' Endpoint: ' + reqUrl.pathname);

    if (reqUrl.pathname == '/model-data' && request.method === 'POST') {
        service.setCommandRequest(request, result);
    }
    else if (reqUrl.pathname == '/model-data' && request.method === 'GET') {
        service.getModelData(request, result);
    }
    else if (reqUrl.pathname == '/configuration' && request.method === 'POST') {
        service.setConfiguration(request, result);
    }
    else if (reqUrl.pathname == '/configuration' && request.method === 'GET') {
        service.getConfiguration(request, result); 
    }
    else if(reqUrl.pathname == '/download' && request.method === 'POST') {
        service.setDownloadRequest(request, result); 
    } 
    else {
        service.invalidRequest(request, result);
    }
});