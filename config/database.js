const express = require('express');
const router = express.Router();
const db = require('../database'); // Tu conexión a MySQL

// Ruta para guardar pedido
router.post('/guardar', async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      products,
      total,
      order_number
    } = req.body;

    console.log('📝 Datos recibidos:', req.body);

    // ✅ GUARDAR EN MYSQL
    const query = `
      INSERT INTO orders
      (order_number, customer_name, customer_email, total, status, created_at)
      VALUES (?, ?, ?, ?, 'Pendiente', NOW())
    `;

    const result = await db.query(query, [
      order_number || `BOX-${Date.now()}`,
      customer_name,
      customer_email,
      parseFloat(total)
    ]);

    const orderId = result.insertId;

    // ✅ GUARDAR PRODUCTOS DEL PEDIDO
    if (products && products.length > 0) {
      for (const item of products) {
        await db.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price) 
                     VALUES (?, ?, ?, ?)`,
            [orderId, item.id, item.quantity, item.price]
        );
      }
    }

    res.json({
      success: true,
      message: '✅ Pedido guardado',
      orderId: orderId,
      orderNumber: order_number
    });

  } catch (error) {
    console.error('❌ Error al guardar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar pedido',
      error: error.message
    });
  }
});

module.exports = router;