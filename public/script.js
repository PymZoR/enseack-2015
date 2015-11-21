'use strict';

/* global L, fetch, document, MouseEvent */

const $cityName          = document.getElementById('cityName');
const $cityPopulation    = document.getElementById('cityPopulation');
const $cityUptake        = document.getElementById('cityUptake');
const $cityRenew         = document.getElementById('cityRenew');
const $cityRenewPossible = document.getElementById('cityRenewPossible');
const $shadow            = document.getElementById('shadow');
const $loader            = document.getElementById('loader');
const $frameContainer    = document.getElementById('frame-container');
const $frame             = document.getElementById('frame');
const $back              = document.getElementById('back');
const $body              = document.body;

let map = L.map('map');
let fakesPoints = [];

map.setView(new L.LatLng(47, 2), 6);

let osmUrl    = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
let osm = new L.TileLayer(osmUrl, {
    minZoom    : 6,
    maxZoom    : 12,
    attribution: osmAttrib
});

map.addLayer(osm);

let mapOpen = false;

let markers = {
    Cergy : L.marker([49.0376128, 2.02858], {
        title: 'Cergy'
    }).addTo(map),
    Troyes: L.marker([48.2924582, 4.0411011], {
        title: 'Troyes'
    }).addTo(map),
    Rennes: L.marker([48.1159102, -1.7234738], {
        title: 'Rennes'
    }).addTo(map),
    Lyon: L.marker([45.7579502, 4.8001017], {
        title: 'Lyon'
    }).addTo(map),
    Bordeaux: L.marker([44.8637226, -0.6211603], {
        title: 'Bordeaux'
    }).addTo(map),
    Marseille: L.marker([43.2803692, 5.3350996], {
        title: 'Marseille'
    }).addTo(map),
    Poitiers: L.marker([46.5846287, 0.3364502], {
        title: 'Poitiers'
    }).addTo(map)
};

let iconRed = L.icon({
    iconUrl        : 'marker-icon-red.png',
    iconRetinaUrl  : 'marker-icon@2x-red.png',
    iconSize       : [25, 41],
    iconAnchor     : [12, 41],
    shadowUrl      : 'dist/images/marker-shadow.png',
    shadowRetinaUrl: 'dist/images/marker-shadow@2x.png',
    shadowSize     : [41, 41]
});

Object.keys(markers).forEach(function (name) {
    let marker = markers[name];

    generateFakeMarkersNearby(marker);

    marker.on('click', function () {
        mapOpen = !mapOpen;

        $loader.style.display = 'block';

        fetch('/percentRenwable/' + name, {
            method: 'get'
        }).then(function (response) {
            return response.json();
        }).then(function (response) {
            $cityName.innerHTML            = name + '&nbsp;&nbsp;';

            let $a = document.createElement('a');
            $a.textContent = '(graphiques)';
            $a.href        = '#';
            $a.addEventListener('click', function (e) {
                e.preventDefault();
                $frame.src = 'chart.html#' + marker.options.title;
            }, false);
            $frame.onload = function () {
                $frameContainer.style.top = '0';
            };

            $cityName.appendChild($a);

            $cityPopulation.textContent    = response.population;
            $cityUptake.textContent        = Math.round(response.uptake / 1000);
            $cityRenew.textContent         = Math.round(response.wattHRenwable / response.uptake * 1000) / 10;
            $cityRenewPossible.textContent = Math.round(response.totalKWH * 100) / 100 + '%';

            $body.className += ' loaderHide';

            setTimeout(function () {
                $loader.style.display = 'none';
            }, 300);
        });

        if (mapOpen) {
            $body.className = 'mapOpen';
            $shadow.style.display = 'block';
            $shadow.style.opacity = '0';
            setTimeout(function () {
                $shadow.style.opacity = '0.7';
            }, 50);
        } else {
            $body.className = '';
        }
    });
});

$shadow.addEventListener('click', function () {
    if ($body.className.indexOf('loaderHide') === -1) {
        return;
    }

    mapOpen = false;

    $body.className       = '';
    $shadow.style.opacity = '0';

    setTimeout(function () {
        $shadow.style.display = 'none';
    }, 300);
}, false);

$back.addEventListener('click', function () {
    $frame.src = '';
    setTimeout(function () {
        $frameContainer.style.top = '-100%';
    }, 500);
    const e = new MouseEvent('click');
    $shadow.dispatchEvent(e);
}, false);

map.on('zoomend', function (e) {
    const level = e.target._zoom;
    if (level >= 11) {
        fakesPoints.forEach(function (marker) {
            marker.setOpacity(1);
        });
    } else {
        fakesPoints.forEach(function (marker) {
            marker.setOpacity(0);
        });
    }
});

function generateFakeMarkersNearby (marker) {
    const initPos = marker._latlng;

    for (let i = 0; i < 10; i++) {
        const newPos = [
            initPos.lat + getRandom(-0.05, 0.05),
            initPos.lng + getRandom(-0.05, 0.05)
        ];

        let newMarker = L.marker(newPos, {
            icon: iconRed
        }).addTo(map);
        newMarker.setOpacity(0);
        fakesPoints.push(newMarker);
    }
}

function getRandom (min, max) {
    return Math.random() * (max - min) + min;
}
