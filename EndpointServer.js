var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );

console.log( networkInterfaces );

const ip = networkInterfaces.eth0[0].address;
const port = 3355;

const server = require('./EndpointController.js');
const service = require('./EndpointService.js');
service.Init();
server.listen(port, ip, () => {
    console.log(`Server running at http://${ip}:${port}/`);
});


