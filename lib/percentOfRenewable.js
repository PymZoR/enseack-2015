'use strict';

const axios = require('axios');

const populationPerRegions = {
    'Île-de-France'              : 11898502,
    'Champagne-Ardenne'          : 1339270,
    Picardie                     : 1922342,
    'Haute-Normandie'            : 1845547,
    'Centre-Val de Loire'        : 2563586,
    'Basse-Normandie'            : 1477209,
    Bourgogne                    : 1641130,
    'Nord-Pas-de-Calais'         : 4050756,
    Lorraine                     : 2346292,
    Alsace                       : 1859869,
    'Franche-Comté'              : 1177906,
    'Pays de la Loire'           : 3632614,
    Bretagne                     : 3273343,
    'Poitou-Charentes'           : 1783991,
    Aquitaine                    : 3285970,
    'Midi-Pyrénées'              : 2926592,
    Limousin                     : 738633,
    'Rhône-Alpes'                : 6449000,
    Auvergne                     : 1354104,
    'Languedoc-Roussillon'       : 2700266,
    'Provence-Alpes-Côte d\'Azur': 4935576,
    Corse                        : 316257,
    Guadeloupe                   : 403314,
    Martinique                   : 388364,
    Guyane                       : 239648,
    'La Réunion'                 : 833944,
    Mayotte                      : 217091
};

const REGION_URL = 'http://www.communes.com/recherche/?q=';

module.exports = cityName => new Promise((resolve, reject) => {
    axios.get(REGION_URL + cityName)
        .then(response => {
            resolve(response);
        })
        .catch(err => {
            reject({
                err: err.message
            });
        });
});
