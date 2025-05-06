const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');

router.post('/', cartController.addItemToCart);
router.post('/:id', cartController.updateCartItem);
router.get('/:id', cartController.getCartItems);
router.delete('/:id', cartController.deleteItemFromCart);
router.post('/checkout/:id', cartController.checkout)

module.exports = router;