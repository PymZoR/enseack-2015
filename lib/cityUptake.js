'use strict';

const axios = require('axios');

const BASE_URL       = 'http://www.insee.fr/fr/ppp/bases-de-donnees/recensement/populations-legales';
const NUMBER_URL     = `${BASE_URL}/zonages.xml.asp?q=`;
const POPULATION_URL = `${BASE_URL}/commune.asp?depcom=`;

const HOME_UPTAKE_PER_YEAR = 7200;
const PEOPLE_PER_HOME      = 1;

module.exports = cityName => new Promise((resolve, reject) => {
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

            const uptake = HOME_UPTAKE_PER_YEAR * population / PEOPLE_PER_HOME;

            resolve({
                uptake,
                population
            });
        })
        .catch(err => {
            reject({
                err: err.message
            });
        });
});
