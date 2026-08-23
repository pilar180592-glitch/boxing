const express = require('express');
const router = express.Router();
const db = require('../database');

// ✅ Ruta para guardar pedido (CORREGIDO)
router.post('/guardar', async (req, res) => {
  console.log('🟢 Recibiendo pedido...');

  try {
    const {
      nombre_cliente,
      apellido_cliente,
      correo,
      telefono,
      direccion,
      products,
      total,
      order_number,
      usuario_id
    } = req.body;

    console.log('📝 Datos recibidos:', req.body);

    // Validar datos obligatorios
    if (!nombre_cliente || !correo || !products || !total) {
      return res.status(400).json({
        success: false,
        message: '❌ Faltan datos: nombre_cliente, correo, products, total',
        recibido: { nombre_cliente, correo, products, total }
      });
    }

    // ✅ 1. GUARDAR EN TABLA "pedidos"
    const orderNum = order_number || `BOX-${Date.now()}`;
    const queryPedido = `
      INSERT INTO pedidos 
      (usuario_id, nombre_cliente, apellido_cliente, correo, telefono, direccion, total, estado, creado_en) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())
    `;

    const resultPedido = await db.query(queryPedido, [
      usuario_id || null,
      nombre_cliente,
      apellido_cliente || '',
      correo,
      telefono || '',
      direccion || '',
      parseFloat(total)
    ]);

    // Obtener ID del pedido
    let orderId = resultPedido.insertId ||
        resultPedido.rows?.insertId ||
        resultPedido[0]?.insertId;

    if (!orderId) {
      throw new Error('No se pudo obtener el ID del pedido');
    }

    console.log('✅ Pedido creado con ID:', orderId);

    // ✅ 2. GUARDAR PRODUCTOS EN "pedido_productos"
    if (products && products.length > 0) {
      for (const item of products) {
        const productId = item.id || item.producto_id;
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.price) || 0;

        if (!productId) {
          console.warn('⚠️ Producto sin ID, omitiendo...');
          continue;
        }

        await db.query(
            `INSERT INTO pedido_productos 
           (pedido_id, producto_id, cantidad, precio) 
           VALUES (?, ?, ?, ?)`,
            [orderId, productId, quantity, price]
        );

        console.log(`✅ Producto ${productId} agregado (${quantity}x $${price})`);
      }
    }

    // ✅ 3. RESPONDER
    res.status(201).json({
      success: true,
      message: '✅ Pedido guardado exitosamente',
      data: {
        orderId: orderId,
        orderNumber: orderNum,
        nombre_cliente,
        apellido_cliente,
        correo,
        total: parseFloat(total),
        estado: 'pendiente'
      }
    });

  } catch (error) {
    console.error('❌ ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar pedido',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ Ruta para listar pedidos (CORREGIDO)
router.get('/listar', async (req, res) => {
  try {
    const pedidos = await db.query(`
      SELECT p.*, 
             COUNT(pp.id) as total_items,
             GROUP_CONCAT(CONCAT('Producto ', pp.producto_id, ' x', pp.cantidad) SEPARATOR ', ') as productos_list
      FROM pedidos p
      LEFT JOIN pedido_productos pp ON p.id = pp.pedido_id
      GROUP BY p.id
      ORDER BY p.creado_en DESC
    `);

    res.json({
      success: true,
      count: pedidos.length || 0,
      data: pedidos
    });

  } catch (error) {
    console.error('❌ Error al listar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
});

// ✅ Ruta para obtener un pedido específico (CORREGIDO)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await db.query(`
      SELECT p.*, 
             GROUP_CONCAT(CONCAT(pr.nombre, ' x', pp.cantidad, ' - $', pp.precio) SEPARATOR ', ') as productos_list
      FROM pedidos p
      LEFT JOIN pedido_productos pp ON p.id = pp.pedido_id
      LEFT JOIN productos pr ON pp.producto_id = pr.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (!pedido || pedido.length === 0) {
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
        pedido: pedido[0],
        productos: productos
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    });
  }
});

// ✅ Actualizar estado del pedido (CORREGIDO)
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Opciones: ' + estadosValidos.join(', ')
      });
    }

    const result = await db.query(
        `UPDATE pedidos SET estado = ? WHERE id = ?`,
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
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar pedido',
      error: error.message
    });
  }
});

module.exports = router;