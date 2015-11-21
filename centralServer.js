'use strict';

let express            = require('express');
let bodyParser         = require('body-parser');
let app                = express();
let server             = require('http').Server(app);
let io                 = require('socket.io')(server);
let cityUptake         = require('./lib/cityUptake');
let percentOfRenewable = require('./lib/percentOfRenewable');
let sendMail           = require('./lib/sendMail');

const PORT                 = 8080;
const FAKE_DAYS            = 30;
const HOME_UPTAKE_PER_YEAR = 7200;
const NIGHT_COEF           = 0.52;

let cities = {};

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('node_modules/leaflet'));
app.use(express.static('node_modules/loaders.css'));
app.use(express.static('node_modules/chartist'));
app.use(express.static('node_modules/Swipe'));

app.get('/uptakeCity/:cityName', (req, res) => {
    const cityName = req.params.cityName;

    cityUptake(cityName)
        .then(data => {
            res.status(200).json(data).end();
        })
        .catch(err => {
            res.status(500).json(err).end();
        });
});

app.get('/percentRenwable/:cityName', (req, res) => {
    const cityName = req.params.cityName;

    let totalKWH = 0;

    if (cities[cityName]) {
        totalKWH = cities[cityName].sun.reduce((a, b) => a + b) * NIGHT_COEF +
                   cities[cityName].wind.reduce((a, b) => a + b);

        totalKWH = totalKWH / HOME_UPTAKE_PER_YEAR * 100;
        totalKWH = totalKWH / 1000;
    }

    percentOfRenewable(cityName)
        .then(data => {
            data.totalKWH = totalKWH;
            res.status(200).json(data).end();
        })
        .catch(err => {
            res.status(500).json(err).end();
        });
});

app.get('/chart/:cityName', (req, res) => {
    const cityName = req.params.cityName;
    let values;

    if (!cities[cityName]) {
        values = {
            sun : [0],
            wind: [0]
        };
    }
    else {
        values = cities[cityName];
    }

    res.status(200).json(values).end();
});

app.post('/data', (req, res) => {
    const cityName  = req.body.city;
    const sunValue  = req.body.sun;
    const windValue = req.body.wind;

    if (!cities[cityName]) {
        cities[cityName] = {
            sun : [],
            wind: []
        };
    }

    for (let i = FAKE_DAYS - 1; i >= 0; i--) {
        cities[cityName].sun.push(sunValue);
        cities[cityName].wind.push(windValue);
    }

    console.log('New value for city ' + cityName,
            cities[cityName].sun[cities[cityName].sun.length - 1],
            cities[cityName].wind[cities[cityName].wind.length - 1]);
    console.log('Number of values', cities[cityName].sun.length / FAKE_DAYS);

    if (cities[cityName].sun.length / FAKE_DAYS === 12) {
        let totalKWH = cities[cityName].sun.reduce((a, b) => a + b) * NIGHT_COEF +
                   cities[cityName].wind.reduce((a, b) => a + b);

        totalKWH = totalKWH / HOME_UPTAKE_PER_YEAR * 100;
        totalKWH = totalKWH / 1000;

        sendMail(totalKWH > 12);
    }

    io.emit('data', {
        city: cityName,
        sun : sunValue,
        wind: windValue
    });

    res.status(200).end();
});

server.listen(PORT, () => {
    console.log('Server listening on 0.0.0.0:' + PORT);
});
