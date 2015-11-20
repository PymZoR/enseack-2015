'use strict';

const express    = require('express');
const bodyParser = require('body-parser');
const app        = express();

const cityUptake         = require('./lib/cityUptake');
const percentOfRenewable = require('./lib/percentOfRenewable');

const PORT      = 8080;
const FAKE_DAYS = 30;

let cities = {};

app.use(bodyParser.json());
app.use(express.static('public'));

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

app.post('/data', (req, res) => {
    const cityName  = req.body.city;
    const sunValue  = req.body.sun;
    const windValue = req.body.wind;

    let firstPromise = new Promise(resolve => resolve());

    if (!cities[cityName]) {
        firstPromise = cityUptake(cityName);
    }

    firstPromise
        .then(data => {
            if (!cities[cityName]) {
                cities[cityName] = {
                    originalPopulation: data.population,
                    originalUptake    : data.uptake,
                    sunSum            : 0,
                    numberOfValues    : 0,
                    windSum           : 0
                };
            }

            for (let i = FAKE_DAYS - 1; i >= 0; i--) {
                cities[cityName].sunSum  += sunValue;
                cities[cityName].windSum += windValue;

                cities[cityName].numberOfValues++;
            }

            res.status(200).end();
        })
        .catch(() => {
            res.status(500).end();
        });
});

const server = app.listen(PORT, () => {
    const addr = server.address();
    console.log(`Listening at http://${addr.address}:${addr.port}`);
});
