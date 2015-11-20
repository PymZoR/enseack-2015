'use strict';

const express    = require('express');
const bodyParser = require('body-parser');
const axios      = require('axios');
const app        = express();

const PORT = 8080;

const HOME_UPTAKE_PER_YEAR = 7000;

app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/uptakeCity/:cityName', (req, res) => {
    const BASE_URL       = 'http://www.insee.fr/fr/ppp/bases-de-donnees/recensement/populations-legales';
    const NUMBER_URL     = `${BASE_URL}/zonages.xml.asp?q=`;
    const POPULATION_URL = `${BASE_URL}/commune.asp?depcom=`;

    // const cityName = req.body.cityName;
    const cityName = req.params.cityName;

    console.log(`-> Asking city number for city : ${cityName}`);

    axios
        .get(NUMBER_URL + cityName)
        .then(response => {
            let firstStep = response.data.split('<zone codgeo="');

            if (!firstStep[1]) {
                throw new Error('No city found');
            }

            let cityIndex = firstStep[1].split('"')[0];

            return cityIndex;
        })
        .then(cityIndex => axios.get(POPULATION_URL + cityIndex))
        .then(response => {
            const data           = response.data;
            const lastChiffrePos = data.lastIndexOf('tab-chiffre');

            // Slice from last position of tab-chiffre + 13 (size of tab-chiffre + end td tag)
            // To the next </td appearing
            let population = data
                .slice(lastChiffrePos + 13, data.indexOf('</td>', lastChiffrePos))
                .replace(/\D/g, '');

            population = parseInt(population, 10);

            const uptake = HOME_UPTAKE_PER_YEAR * population;

            res.status(200).json({
                uptake,
                population
            }).end();
        })
        .catch(err => {
            res.status(500).json({
                err: err.message
            }).end();
        });
});

const server = app.listen(PORT, () => {
    const addr = server.address();
    console.log(`Listening at http://${addr.address}:${addr.port}`);
});
