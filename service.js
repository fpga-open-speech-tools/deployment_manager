const url = require('url');
const fs = require('fs');

const deviceLocation = "/sys/class";
const fe = "/fe_";

const downloadScriptPath = "../utils"
const configPath = "../config"


var cmd;

var CommandObject;
var progress = JSON.parse('{"name": "", "progress": 0, "status": ""}');
// UIrawdata = fs.readFileSync('UI.json');
// UIObject = JSON.parse(UIrawdata);

exports.Init = function(){
    return;
}


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

getJsonFromFile = function(filepath){
    fs.open;
    // console.log(configPath + '/UI.json')
    // fs.readFile(configPath + '/UI.json','utf-8',(err,data) => {
    //     // console.log(data)
    //     if(err){throw err;}
    //     UIObject = JSON.parse(data);
    //     console.log(JSON.stringify(UIObject));
    // });
    const objFromFile = fs.readFileSync(filepath, 
        {encoding: 'utf-8', flag: 'r'})
    fs.close;

    return JSON.parse(objFromFile);
}

var LinkerObject = getJsonFromFile(configPath + '/Linker.json');

execCB = function(error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
}
progressCB = function(error, stdout, stderr) {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log('progress receipt: ' + stdout)
    progress = JSON.parse(stdout.substring(1))
    // if (stdout.charAt(0) == 'j') {
    // }
    // else if (stdout.charAt(0) == 'c') {
    //     console.log('done!')
    // }
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

    const UIObject = getJsonFromFile(configPath + '/UI.json')

    // console.log(JSON.stringify(UIObject));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(UIObject));
};

exports.invalidRequest = function (req, res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Invalid Request');
};

exports.setDownloadRequest = function (req, res) {
    //console.log('New Command Received.');
    body = '';

    req.on('data', function (chunk) {
        body += chunk;
    });

    req.on('end', function () {

    try{
        postBody = JSON.parse(body);
        CommandObject = postBody;

        // any unix based command
        var cmdToLaunch =  "./" + downloadScriptPath + "/awsdownload.py -b nih-demos -d " + CommandObject.downloadurl;
        console.log(cmdToLaunch)

        // const { spawn } = require("child_process");
        var exec = require('child_process').exec;
        exec(cmdToLaunch, progressCB)

        // for await (const data of child.stdout) {
        //     progress = JSON.parse(data)
        // }

        // for await (const data of child.close) {
        //     console.log("python is done")
        // }

        var projectName = CommandObject.projectname.replace('-','_')

        var cmdToLaunch = "./" + downloadScriptPath + "/overlaymgr load " + projectName
        exec(cmdToLaunch, execCB)

        var cmdToLaunch = "./" + downloadScriptPath + "/drivermgr load " + projectName
        exec(cmdToLaunch,execCB)

        LinkerObject = getJsonFromFile(configPath + '/Linker.json')
        
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(CommandObject));

    }
    catch(error){
        //Do Nothing ;)
    }
    });
};

exports.getDownloadProgress = function(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(progress));
};

// cmd.on("close", code => {
//     console.log(`program done with exit code ${code}`);
// });