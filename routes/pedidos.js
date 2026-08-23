const express = require('express');
const router = express.Router();
const db = require('../database'); // Ajusta según tu configuración

// ✅ CREAR PEDIDO (GUARDAR EN MySQL)
router.post('/create', async (req, res) => {
  try {
    console.log('📝 Datos del pedido recibidos:', req.body);

    const { customer_name, customer_email, products, total } = req.body;

    // Validar datos básicos
    if (!customer_name || !customer_email || !products || !total) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos del pedido'
      });
    }

    // ✅ 1. GUARDAR EL PEDIDO PRINCIPAL
    const orderQuery = `
            INSERT INTO orders (customer_name, customer_email, total, status, created_at) 
            VALUES (?, ?, ?, 'Pendiente', NOW())
        `;

    const orderResult = await db.query(orderQuery, [
      customer_name,
      customer_email,
      parseFloat(total)
    ]);

    const orderId = orderResult.insertId;
    console.log('📦 Pedido creado con ID:', orderId);

    // ✅ 2. GUARDAR LOS DETALLES DEL PEDIDO
    if (products && products.length > 0) {
      for (const item of products) {
        const detailQuery = `
                    INSERT INTO order_items (order_id, product_id, quantity, price) 
                    VALUES (?, ?, ?, ?)
                `;

        await db.query(detailQuery, [
          orderId,
          item.product_id,
          item.quantity,
          parseFloat(item.price)
        ]);

        // ✅ 3. ACTUALIZAR STOCK (opcional)
        const updateStockQuery = `
                    UPDATE products 
                    SET stock = stock - ? 
                    WHERE id = ? AND stock >= ?
                `;

        await db.query(updateStockQuery, [
          item.quantity,
          item.product_id,
          item.quantity
        ]);
      }
    }

    // ✅ 4. OBTENER EL PEDIDO COMPLETO PARA RESPONDER
    const getOrderQuery = `
            SELECT o.*, 
                   GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as products_list
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = ?
            GROUP BY o.id
        `;

    const [orderComplete] = await db.query(getOrderQuery, [orderId]);

    res.status(201).json({
      success: true,
      message: '✅ Pedido guardado exitosamente',
      data: orderComplete
    });

  } catch (error) {
    console.error('❌ Error al guardar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar el pedido',
      error: error.message
    });
  }
});

// ✅ OBTENER TODOS LOS PEDIDOS
router.get('/', async (req, res) => {
  try {
    const query = `
            SELECT o.*, 
                   COUNT(oi.id) as total_items,
                   GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ')') SEPARATOR ', ') as products_list
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;

    const orders = await db.query(query);

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('❌ Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
});

// ✅ OBTENER UN PEDIDO POR ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    const orderQuery = `
            SELECT o.*, 
                   GROUP_CONCAT(CONCAT(p.name, ' (x', oi.quantity, ') - $', oi.price) SEPARATOR ', ') as products_list
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = ?
            GROUP BY o.id
        `;

    const [order] = await db.query(orderQuery, [orderId]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener detalles del pedido
    const detailsQuery = `
            SELECT oi.*, p.name as product_name, p.brand
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;

    const details = await db.query(detailsQuery, [orderId]);

    res.json({
      success: true,
      data: {
        order: order,
        items: details
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido',
      error: error.message
    });
  }
});

// ✅ ACTUALIZAR ESTADO DEL PEDIDO
router.put('/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatus = ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const query = `
            UPDATE orders 
            SET status = ?, updated_at = NOW() 
            WHERE id = ?
        `;

    const result = await db.query(query, [status, orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: '✅ Estado del pedido actualizado',
      data: { id: orderId, status }
    });

  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el pedido',
      error: error.message
    });
  }
});

module.exports = router;