const express = require('express');
const router = express.Router();
const passport = require('passport');

console.log('Loading login routes'); // Debug log

// GET /login
router.get('/', (req, res) => {
    console.log('Handling GET /login'); // Debug log
    res.send('Please use a POST request or login form.');
});

// POST /login
router.post('/', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: false
}));

module.exports = router;