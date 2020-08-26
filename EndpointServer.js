#!/usr/bin/env node
var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );

console.log( networkInterfaces );

const ip = networkInterfaces.lo[0].address;
const port = 3355;

const server = require('./EndpointController.js');
const service = require('./EndpointService.js');
service.Init();
// TODO: listen on lo and eth0 and wlan?
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://${ip}:${port}/`);
});


