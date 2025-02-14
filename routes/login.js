const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

router.get('/login', async (req, res) => {
    res.render('login');
});

router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        req.session.isLoggedIn = true;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Onjuist wachtwoord. Probeer het opnieuw.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Fout bij uitloggen:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
