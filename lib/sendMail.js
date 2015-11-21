'use strict';

let nodemailer    = require('nodemailer');
let smtpTransport = require('nodemailer-smtp-transport');

module.exports = function (report) {
    let transporter = nodemailer.createTransport(smtpTransport({
        host  : 'ssl0.ovh.net',
        port  : 465,
        secure: true,
        auth  : {
            user: 'temp@labate.me',
            pass: 'cloporte10000'
        }
    }));

    let text = report ? 'Bonjour.\r\nIl apparaît que vous avez une grande exposition ou au vent.' +
                        '\r\nCliquez ici pour le rapport complet ainsi que les propositions en terme d\'écologie' :
                        'Bonjour.\r\nIl fait trop moche chez vous.\r\nAu revoir.';

    transporter.sendMail({
        from   : 'temp@labate.me',
        to     : 'caenorst@hotmail.com',
        subject: 'Enseack 2015',
        text   : text
    }, function (error) {
        if (error) {
            console.log(error);
        } else {
            console.log('Sent mail');
        }
    });
};
