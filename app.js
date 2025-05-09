require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('./controllers/auth');

const app = express();

console.log('SESSION_SECRET:', process.env.SESSION_SECRET); // Debug SESSION_SECRET

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const productsRoutes = require('./routes/products');
const loginRoutes = require('./routes/login');

console.log('loginRoutes loaded:', loginRoutes); // Debug login routes

// Load Swagger YAML from the DB folder
const swaggerDocument = YAML.load(path.join(__dirname, './db/swagger.yaml'));

// Mount Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Welcome, ${req.user.username}!`);
    } else {
        res.redirect('/login');
    }
});

app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/cart', cartRoutes);
app.use('/products', productsRoutes);
app.use('/login', loginRoutes);

console.log('All routes registered'); // Debug route registration

// Start server and Swagger
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});