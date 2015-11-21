'use strict';

const express    = require('express');
const bodyParser = require('body-parser');
const app        = express();

const cityUptake         = require('./lib/cityUptake');
const percentOfRenewable = require('./lib/percentOfRenewable');

const PORT      = 8080;
const FAKE_DAYS = 30;

let cities = {
    Paris: {
        sun : [ 100, 125, 122, 100, 122, 140, 145, 145, 130, 100, 90, 80 ],
        wind: [ 86, 134, 87, 141, 92, 142, 96, 124, 88, 112, 143, 117 ]
    }
};

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('node_modules/leaflet'));
app.use(express.static('node_modules/loaders.css'));
app.use(express.static('node_modules/chartist'));

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

    percentOfRenewable(cityName)
        .then(data => {
            res.status(200).json(data).end();
        })
        .catch(err => {
            res.status(500).json(err).end();
        });
});

app.get('/chart/:cityName', (req, res) => {
    const cityName = req.params.cityName;

    if (!cities[cityName]) {
        return res.status(404).end();
    }

    res.status(200).json(cities[cityName]).end();
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

    console.log('New value for city ' + cityName, cities[cityName]);

    res.status(200).end();
});

const server = app.listen(PORT, () => {
    const addr = server.address();
    console.log(`Listening at http://${addr.address}:${addr.port}`);
});
