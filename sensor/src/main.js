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
 * Clear console
 */
function cls() {
    process.stdout.write('\033c');
}

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


    httpClient
        .post(config.centralServer.hostURL, data)
        .then(function (res) {
            // console.log("res: " + res);
        })
        .catch(function (err) {
            // console.log(err.stack);
        });

    // Show datas
    cls();
    console.log('\n\n\n\n');
    console.log('            Current ' + colors.yellow('sun') + '  : ' + sun);
    console.log('            Current ' + colors.blue('wind') + ' : ' + wind);
}


/**
 * Serial config
 */
var serialOpts = {
    baudrate: 9600,
    parser: sp.parsers.raw
};

var serialPort = null;


/**
 * Entry point
 */
cls();
var inputBuffer  = ""
var wind         = 0;
var sun          = 0;
var windReceived = false;
var sunReceived  = false;

sp
    .listAsync()
    .then(function (ports) {

        // Debug
        // console.log('Found ports: ');
        // ports.forEach(function(port) {
        //     console.log(port.comName);
        //     console.log(port.pnpId);
        //     console.log(port.manufacturer);
        // });

        serialPort = new SerialPort(ports[0].comName, serialOpts);
        // console.log("Opening connection on: " + ports[0].comName);
        return serialPort.openAsync();
   })

   .then(function () {
        /**
        * Connection listeners
        */
        serialPort
            .on('open', function () {
                // console.log('Connection opened');
            })
            .on('data', function (data) {
                // console.log('Data received: ');
                // console.log(data.toString());
                inputBuffer += data;

                var windInput = inputBuffer.split('V');
                if (windInput.length >= 2) {
                    var valueInput = windInput[1].split('Z');
                    if (valueInput.length >= 2) {
                        wind = valueInput[0];
                        inputBuffer = valueInput[1];
                        windReceived = true;
                    }
                    else {
                        inputBuffer = 'V' + windInput[1];
                    }
                }

                var sunInput = inputBuffer.split('S');
                if (sunInput.length >= 2) {
                    var valueInput = sunInput[1].split('Z');
                    if (valueInput.length >= 2) {
                        sun = valueInput[0];
                        inputBuffer = valueInput[1];
                        sunReceived = true;
                    }
                    else {
                        inputBuffer = 'S' + sunInput[1];
                    }
                }


                if (windReceived && sunReceived) {
                    sendData(parseFloat(sun), parseFloat(wind));
                    windReceived = false;
                    sunReceived  = false;
                }
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
