const url = require('url');
const fs = require('fs');

const deviceLocation = "/sys/class";
const fe = "/fe_";

var CommandObject;
var LinkerObject;
var UIObject;
UIrawdata = fs.readFileSync('UI.json');
UIObject = JSON.parse(UIrawdata);

exports.Init = function(){
    return;
}

fs.readFile('./Linker.json','utf-8',(err,data) => {
    if(err){throw err;}
    LinkerObject = JSON.parse(data);
});
fs.close;
fs.open;
fs.readFile('./UI.json','utf-8',(err,data) => {
    if(err){throw err;}
    UIObject = JSON.parse(data);
});
fs.close;

findEchoFileFromLinker = function(cmdObj){
    var targetDriver = LinkerObject[cmdObj.module];
    //var targetName = cmdObj.module.ToString();
    var links =  targetDriver['links'];
    var filepath = deviceLocation 
    + fe + cmdObj.module.trim() + '_' + targetDriver.majorNo.trim()
    + fe + cmdObj.module.trim() + '_' + targetDriver.majorNo.trim()
    + links[cmdObj.link].trim();
    //console.log('Command Prepared.' + filepath);
    return filepath;
}

exports.setCommandRequest = function (req, res) {
    //console.log('New Command Received.');
    body = '';

    req.on('data', function (chunk) {
        body += chunk;
    });

    req.on('end', function () {

    try{
        postBody = JSON.parse(body);
        CommandObject = postBody;

       // console.log(CommandObject)

        var echoFile = findEchoFileFromLinker(CommandObject);
        //console.log('\nExpected echo path: ', echoFile)

        var exec = require('child_process').exec;

        // any unix based command
       var cmdToLaunch =  "echo " + CommandObject.value + " > " + echoFile;
       //var cmdToLaunch = "echo 12.00 > /sys/class/fe_bitcrusher_248/fe_bitcrusher_248/bits";

        //console.log('Command: ', cmdToLaunch);
        function execCB(error, stdout, stderr) {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            //console.log('stdout: ' + stdout);
            //console.log('stderr: ' + stderr);
        }

        var app = exec(cmdToLaunch, execCB);
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(CommandObject));

    }
    catch(error){
        //Do Nothing ;)
    }
    });
};



exports.getUIRequest = function (req, res) {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.query.name) {
        name = reqUrl.query.name
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(UIObject));
};

exports.invalidRequest = function (req, res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Invalid Request');
};

