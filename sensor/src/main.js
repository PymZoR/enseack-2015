/**
 * Dependencies
 */
var Promise    = require('bluebird');
var httpClient = require('axios');
var config     = require('../config');
var colors     = require('colors');
var sp         = Promise.promisifyAll(require('serialport'));
var SerialPort = sp.SerialPort;


/**
 * Send new sensors data to global server
 * @param {Number} sun sun power in lumens
 * @param {Number} wind wind power in km/h
 */
function sendData(sun, wind) {
    var data = {
        city: config.city,
        sun: sun,
        wind: wind
    };

    console.log("Sending data...");
    httpClient
        .post(config.centralSever.hostURL, data)
        .then(function (res) {
            console.log("res: " + res);
        })
        .catch(function (err) {
            console.log(err.stack);
        });

    // Clear console
    process.stdout.write('\033c');

    // Show datas
    console.log('\n\n\n\n');
    console.log('            Current ' + colors.yellow('sun') + '  : ' + sun);
    console.log('            Current ' + colors.blue('wind') + ' : ' + wind);
}


/**
 * Serial config
 */
var serialOpts = {
    baudrate: 115200,
    parser: sp.parsers.readline("\n")
};
var serialPort = null;


/**
 * Entry point
 */
sp
    .listAsync()
    .then(function (ports) {
        console.log('Found ports: ');

        ports.forEach(function(port) {
            console.log(port.comName);
            console.log(port.pnpId);
            console.log(port.manufacturer);
        });

        serialPort = new SerialPort(ports[0].comName, serialOpts);
        console.log("Opening connection on: " + ports[0].comName);
        return serialPort.openAsync();
   })
   .then(function () {
        /**
        * Connection listeners
        */
        serialPort
            .on('open', function () {
                console.log('Connection opened');
            })
            .on('data', function (data) {
                console.log('Data received: ');
                console.log(data);

                data = data.split(';');
                sendData(parseFloat(data[0]), parseFloat(data[1]));
            })
            .on('close', function () {
                console.log('Connection closed');
            })
            .on('error', function (err) {
                console.log(err.stack);
            });
   })
   .catch(function (err) {
       console.log(err.stack);
   });
