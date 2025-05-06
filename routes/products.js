const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products');

router.get('/:id', productsController.getProductById);
router.get('/:category', productsController.getProductsByCategory);

module.exports = router;