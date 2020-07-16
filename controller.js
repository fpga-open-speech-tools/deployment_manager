const http = require('http');
const url = require('url');

module.exports = http.createServer((req, res) => {

    const service = require('./service.js');
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname == '/model-data' && req.method === 'PUT') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        
        service.setRegisterConfig(req, res);
    }
    else if (reqUrl.pathname == '/model-data' && req.method === 'GET') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        
        service.getRegisterConfig(req, res);
    }
    else if (reqUrl.pathname == '/configuration' && req.method === 'PUT') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        service.setConfiguration(req, res);
    }
    else if (reqUrl.pathname == '/configuration' && req.method === 'GET') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        service.getConfiguration(req, res); 
    }
    else if(reqUrl.pathname == '/download' && req.method === 'PUT') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        service.setDownloadRequest(req, res); 
    } 
    else if(reqUrl.pathname == '/get-download-progress' && req.method === 'GET') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        service.getDownloadProgress(req, res);
    } 
    else if(reqUrl.pathname == '/set-download-progress' && req.method == 'PUT') {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);
        service.setDownloadProgress(req, res);
    }
    else {
        console.log('Request Type:' + req.method +
            ' Endpoint: ' + reqUrl.pathname);

        service.invalidRequest(req, res);
    }
});