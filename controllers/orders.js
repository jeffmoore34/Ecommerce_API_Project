const pool = require('../db/db.js');

// Get all orders
const getOrders = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Export the functions

module.exports = {
    getOrders,
    getOrderById
};