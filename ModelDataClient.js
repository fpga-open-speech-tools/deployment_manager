'use strict';
const signalR = require("@microsoft/signalr");
const WebSocket = require('ws');
const url = require('url');
const ModelController = require('./ModelController');

class ModelDataClient {
    constructor(url, connected, callback) {
        this.url = url;
        this.connected = connected;
        this.callback = callback;

        this.connection = new signalR.HubConnectionBuilder().withUrl(this.url).build();
    }
    doNothing(obj) {
    }
    sendObject(object) {
        // console.log('sendobject');
        this.connection.invoke("ModelUpdated", object).catch(function (err) {
            return console.error(err.toString());
        });
    }
    verifyConnection() {
        this.connection.invoke("AfterConnected").catch(function (err) {
            return console.error(err.toString());
        });
    }
    startSession() {

        this.connection.on("Connected", (message) => {
            // console.log("connected");
            this.connected = true;
        });

        this.connection.on("Update", (obj) => {
            // console.log("in update");
            // console.log(obj);
            return this.callback(obj)
        });

        this.connection.start()
            .then(function (val) {
            }).then(res => this.verifyConnection())
            .catch(function (err) {
                setTimeout(() => this.connection.start(), 5000);
                return console.error(err.toString());
            });

        this.connection.onclose( () => {
            // console.log('closed');
            this.connected = false;
        });
    }
    addDataSource(req, res) {
        const query = url.parse(req.url, true).query;
        console.log("Connection attempt received")
        if(query.port && query.name){
            console.log(`Attempting to connect to ws://localhost:${query.port}`)
            this.ws = new WebSocket(`ws://localhost:${query.port}`);
            this.ws.on('message', function incoming(data) {
                const name = query.name;
                let dataPacket = {}
                dataPacket.ref = ModelController.getReferenceByName(name);
                dataPacket.value = data;
                console.log(data);
                this.connection.invoke("SendDataPacket", dataPacket).catch(function (err) {
                    return console.error(err.toString());
                });
              });
        }
    }
}

module.exports = ModelDataClient