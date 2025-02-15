const express = require('express');
const router = express.Router();

let globalState = {
    selectedMaterial: null,
    spoolNumber: null
};

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

    res.json({ success: true, message: 'Data stored in session!' });
});

router.get('/get-state', (req, res) => {
    res.json(globalState);
});

router.post('/update-state', (req, res) => {
    const { selectedMaterial, spoolNumber } = req.body;
    if (selectedMaterial !== undefined) {
        globalState.selectedMaterial = selectedMaterial;
    }
    if (spoolNumber !== undefined) {
        globalState.spoolNumber = spoolNumber;
    }
    res.json({ success: true });
});

module.exports = router;
