const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('../db/db'); // Your PostgreSQL pool

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            // Find user by username
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = result.rows[0];
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            // Success
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Serialize user to store in session
passport.serializeUser((user, done) => {
    done(null, user.id); // Store user.id in session
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (err) {
        done(err);
    }
});