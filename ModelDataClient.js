'use strict';
const signalR = require("@microsoft/signalr");
const W3CWebSocket = require('websocket').w3cwebsocket;
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
    addDataSource(port, dataIndex) {
        
        let connectionString = `ws://localhost:${port}/`
        console.log(`Attempting to connect to ${connectionString}`)
        this.ws = new W3CWebSocket(connectionString, 'lws-minimal');
        this.ws.onconnect = function () {
            console.log("WS connection successful");
        }
        this.ws.onmessage = function incoming(data) {
            
            let dataPacket = {}
            dataPacket.index = dataIndex
            dataPacket.value = data.data;
            console.log(dataPacket)
            this.connection.invoke("SendDataPacket", [dataPacket]).catch(function (err) {
                return console.error(err.toString());
            });
            };
        this.ws.onmessage = this.ws.onmessage.bind(this);
    }
}

module.exports = ModelDataClient