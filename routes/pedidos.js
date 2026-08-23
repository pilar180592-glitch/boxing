const express = require('express');
// CORREGIDO: La ruta debe ser '../database' (sube un nivel desde 'routes' y busca el archivo)
const database = require('../config/database');

const router = express.Router();

// Ruta para obtener pedidos por usuario
router.get('/:usuarioId', async (request, response, next) => {
  try {
    const [pedidos] = await database.query(
        'SELECT id, total, estado, creado_en FROM pedidos WHERE usuario_id = ? ORDER BY creado_en DESC',
        [request.params.usuarioId]
    );
    response.json(pedidos);
  } catch (error) {
    next(error);
  }
});

// Ruta para CREAR un pedido (POST /api/pedidos)
router.post('/', async (request, response, next) => {
  // Quitamos la transacción manual por simplicidad y usamos la conexión directa
  try {
    // Extraemos los datos directamente del body (como los envía el formulario)
    const {
      nombre_cliente,
      apellido_cliente,
      segundo_apellido,
      correo,
      telefono,
      direccion,
      total
    } = request.body;

    // Validación básica
    if (!nombre_cliente || !correo || !total) {
      return response.status(400).json({ error: 'nombre_cliente, correo y total son obligatorios' });
    }

    // Insertamos el pedido en la tabla 'pedidos'
    const [result] = await database.query(
        `INSERT INTO pedidos
         (nombre_cliente, apellido_cliente, segundo_apellido, correo, telefono, direccion, total, estado, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
        [nombre_cliente, apellido_cliente || null, segundo_apellido || null, correo, telefono || null, direccion || null, total]
    );

    // Respondemos con éxito
    response.status(201).json({
      id: result.insertId,
      numeroPedido: `BOX-${result.insertId}`,
      estado: 'pendiente'
    });

  } catch (error) {
    console.error('Error al insertar pedido:', error);
    next(error);
  }
});

module.exports = router;