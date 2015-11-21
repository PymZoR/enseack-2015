/**
 * Dependencies
 */
var Promise    = require('bluebird');
var httpClient = require('axios');
var config     = require('../config');
var colors     = require('colors');
var sp         = Promise.promisifyAll(require('serialport'));
var SerialPort = sp.SerialPort;


var data = {
  0: 0,
  4: 15,
  8: 60,
  12: 187.5,
  16: 375,
  20: 700,
  24: 950,
  28: 1220,
  32: 1200,
  36: 1120,
  40: 1000,
  44: 940,
  48: 900,
  52: 880,
  56: 0
};

/**
 * Clear console
 */
function cls() {
    //process.stdout.write('\033c');
}

/**
 * Convert klux to W.h
 * @param {Number} klux
 * @return {Number} W.h
 */
function luxToWh(klux) {
    console.log('GOT ', klux);
  const MAX_LUX = 120 * 1000;
  const KWH_M2_MAX_LUX = 0.8 / 24;

  const percentMaxLux = klux * 1000 / MAX_LUX;
  console.log('That means', percentMaxLux, 'of 130klux');

  const wh = percentMaxLux * KWH_M2_MAX_LUX * config.roofSurface;
  console.log('result :', wh);

  return wh;
}


/**
 * Conver km/h to W.h
 * @param {Number} km.h
 * @return {Number} W.h
 */
function kmHToWh(kmH) {
    var miles = kmH / 1.6;
    if (miles > 56 || miles < 0) {
      return 0;
    }

    if (data[miles] !== undefined) {
        return data[miles];
    }

    var breakpoints = Object.keys(data);
    var x1, x2, y1, y2;
    breakpoints.forEach(breakpoint => {
        if (!(miles - 4 > breakpoint) && !x1) {
            x1 = breakpoint;
            y1 = data[x1];
            x2 = (parseInt(breakpoint, 10) + 4).toString();
            y2 = data[x2];
        }
    });

    var a = (y2 - y1)/(x2 - x1);
    var b = ((x2 * y1) - (x1 * y2)) / (x2 - x1);

    var value = a * miles + b;

    return value;
}


/**
 * Send new sensors data to global server
 * @param {Number} sun sun power in lumens
 * @param {Number} wind wind power in km/h
 */
function sendData(sun, wind) {
    var data = {
        city: config.city,
        sun: luxToWh(sun),
        wind: kmHToWh(wind)
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
