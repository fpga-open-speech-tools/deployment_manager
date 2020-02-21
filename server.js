var os = require( 'os' );
var networkInterfaces = os.networkInterfaces( );

console.log( networkInterfaces );

const hostname = networkInterfaces.eth0.address;
const port = 3355;

const server = require('./controller.js');
const service = require('./service.js');
service.Init();
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});


