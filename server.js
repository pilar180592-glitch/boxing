const express = require('express');
const router = express.Router();
const db = require('../database');

// ✅ Ruta para guardar pedido (CORREGIDO con tus tablas)
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

    // Validar datos obligatorios
    if (!customer_name || !customer_email || !products || !total) {
      return res.status(400).json({
        success: false,
        message: '❌ Faltan datos obligatorios'
      });
    }

    // ✅ GUARDAR EN TABLA "pedidos" (NO "orders")
    const query = `
      INSERT INTO pedidos 
      (numero_pedido, nombre_cliente, email_cliente, total, estado, fecha_creacion) 
      VALUES (?, ?, ?, ?, 'Pendiente', NOW())
    `;

    const result = await db.query(query, [
      order_number || `BOX-${Date.now()}`,
      customer_name,
      customer_email,
      parseFloat(total)
    ]);

    // 🔥 OBTENER ID CORRECTAMENTE
    let orderId;
    if (result && result.insertId) {
      orderId = result.insertId;
    } else if (result && result.rows && result.rows.insertId) {
      orderId = result.rows.insertId;
    } else if (Array.isArray(result) && result[0] && result[0].insertId) {
      orderId = result[0].insertId;
    } else {
      orderId = Date.now();
      console.warn('⚠️ Usando timestamp como ID de fallback');
    }

    console.log('✅ ID del pedido:', orderId);

    // ✅ GUARDAR PRODUCTOS EN TABLA "pedido_productos" (NO "order_items")
    if (products && products.length > 0) {
      for (const item of products) {
        await db.query(
            `INSERT INTO pedido_productos (pedido_id, producto_id, cantidad, precio) 
           VALUES (?, ?, ?, ?)`,
            [orderId, item.id || item.product_id, item.quantity || 1, item.price || 0]
        );
        console.log(`✅ Producto ${item.id} agregado al pedido ${orderId}`);
      }
    }

    res.json({
      success: true,
      message: '✅ Pedido guardado exitosamente',
      orderId: orderId,
      orderNumber: order_number || `BOX-${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Error al guardar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar pedido',
      error: error.message
    });
  }
});

// ✅ Ruta para listar pedidos (CORREGIDO)
router.get('/listar', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, 
             COUNT(pp.id) as total_items,
             GROUP_CONCAT(CONCAT('Producto ', pp.producto_id, ' x', pp.cantidad) SEPARATOR ', ') as productos_list
      FROM pedidos p
      LEFT JOIN pedido_productos pp ON p.id = pp.pedido_id
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
    `);

    res.json({
      success: true,
      count: result.length || 0,
      data: result
    });

  } catch (error) {
    console.error('❌ Error al listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
});

// ✅ Ruta para obtener un pedido específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [pedido] = await db.query(`
      SELECT p.*, 
             GROUP_CONCAT(CONCAT(pr.nombre, ' x', pp.cantidad, ' - $', pp.precio) SEPARATOR ', ') as productos_list
      FROM pedidos p
      LEFT JOIN pedido_productos pp ON p.id = pp.pedido_id
      LEFT JOIN productos pr ON pp.producto_id = pr.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const productos = await db.query(`
      SELECT pp.*, pr.nombre as producto_nombre
      FROM pedido_productos pp
      JOIN productos pr ON pp.producto_id = pr.id
      WHERE pp.pedido_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        pedido: pedido,
        productos: productos
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    });
  }
});

// ✅ Actualizar estado del pedido
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const result = await db.query(
        `UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?`,
        [estado, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: '✅ Estado actualizado',
      data: { id, estado }
    });

  } catch (error) {
    console.error('❌ Error al actualizar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar pedido',
      error: error.message
    });
  }
});

module.exports = router;