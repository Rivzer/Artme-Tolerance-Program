const express = require('express');
const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

router.get('/', isAuthenticated, (req, res) => {
    const userData = req.session.userData || {};
    res.render('index', { userData });
});

router.post('/save', (req, res) => {
    const { material, spoolNumber, someOtherValue } = req.body;

    req.session.userData = { material, spoolNumber, someOtherValue };

    res.json({ success: true, message: 'Data opgeslagen in sessie!' });
});

module.exports = router;
