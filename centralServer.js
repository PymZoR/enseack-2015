'use strict';

const express = require('express');
const app     = express();

const PORT = 8080;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const server = app.listen(PORT, () => {
    const addr = server.address();
    console.log(`Listening at http://${addr.address}:${addr.port}`);
});
