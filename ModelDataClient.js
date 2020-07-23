'use strict';
const signalR = require("@microsoft/signalr");

let connection = new signalR.HubConnectionBuilder().withUrl("http://192.168.0.108:5002/model-data").build();

class ModelDataClient {
    constructor(connected, callback) {
        this.connected = connected;
        this.callback = callback;
    }
    doNothing(obj) {
    }
    sendObject(object) {
        console.log('sendobject');
        connection.invoke("ModelUpdated", object).catch(function (err) {
            return console.error(err.toString());
        });
    }
    verifyConnection() {
        connection.invoke("AfterConnected").catch(function (err) {
            return console.error(err.toString());
        });
    }
    startSession() {

        connection.on("Connected", (message) => {
            console.log("connected");
            this.connected = true;
        });

        connection.on("Update", (obj) => {
            console.log("in update");
            console.log(obj);
            return this.callback(obj.dataPackets)
        });
        connection.start()
            .then(function (val) {
            }).then(res => this.verifyConnection())
            .catch(function (err) {
                setTimeout(() => connection.start(), 5000);
                return console.error(err.toString());
            });
    }

}

module.exports = ModelDataClient