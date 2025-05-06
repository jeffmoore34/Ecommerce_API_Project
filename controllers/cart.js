const pool = require('../db/db.js');

const getCartItems = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addItemToCart = async (req, res) => {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    try {
        const result = await pool.query('INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *', [userId, productId, quantity]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteItemFromCart = async (req, res) => {
    const { userId, itemId } = req.params;
    try {
        const result = await pool.query('DELETE FROM cart WHERE user_id = $1 AND id = $2 RETURNING *', [userId, itemId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateCartItem = async (req, res) => {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;
    try {
        const result = await pool.query('UPDATE cart SET quantity = $1 WHERE user_id = $2 AND id = $3 RETURNING *', [quantity, userId, itemId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const checkout = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { id: userId } = req.user;
        const { paymentInfo } = req.body; // Expecting paymentInfo with card details or token from Stripe.js

        // Begin transaction
        await client.query('BEGIN');

        // Step 1: Validate the cart
        const cartResult = await client.query(`
            SELECT c.id, c.product_id, c.quantity, p.price
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = $1
        `, [userId]);

        if (cartResult.rows.length === 0) {
            throw new Error('Cart is empty');
        }

        // Step 2: Calculate total price
        let totalPrice = 0;
        for (const item of cartResult.rows) {
            if (item.quantity <= 0) {
                throw new Error(`Invalid quantity for product ID ${item.product_id}`);
            }
            totalPrice += item.quantity * item.price;
        }

        // Step 3: Process payment with Stripe
        const paymentIntent = await Stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentInfo.payment_method_id, // Token from Stripe.js frontend
            confirmation_method: 'manual',
            confirm: true,
            return_url: 'http://yourdomain.com/checkout/success' // Replace with your success URL
        });

        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment processing failed');
        }

        // Step 4: Create order
        const orderResult = await client.query(`
            INSERT INTO orders (user_id, total_price, status, transaction_id, created_at)
            VALUES ($1, $2, 'completed', $3, NOW())
            RETURNING id
        `, [userId, totalPrice, paymentIntent.id]);

        const orderId = orderResult.rows[0].id;

        // Step 5: Add order items
        for (const item of cartResult.rows) {
            await client.query(`
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `, [orderId, item.product_id, item.quantity, item.price]);
        }

        // Step 6: Clear cart
        await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

        // Commit transaction
        await client.query('COMMIT');

        // Respond with success
        res.status(200).json({
            message: 'Checkout successful',
            order_id: orderId,
            total_price: totalPrice,
            transaction_id: paymentIntent.id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Checkout failed: ' + error.message });
    } finally {
        client.release();
    }
};

// Export
module.exports = {
    getCartItems,
    addItemToCart,
    updateCartItem,
    deleteItemFromCart,
    checkout
};