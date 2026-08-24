const express = require('express');
const router = express.Router();

const db = require('../database');

/*
==================================================
GUARDAR PEDIDO
POST /api/orders/guardar
==================================================
*/

router.post('/guardar', async (req, res) => {

  console.log('=================================');
  console.log('NUEVO PEDIDO');
  console.log('=================================');
  console.log(req.body);

  let connection;

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

    /*
    ==============================
    VALIDACIÓN
    ==============================
    */

    if (!nombre_cliente) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }

    if (!correo) {
      return res.status(400).json({
        success: false,
        message: 'El correo es obligatorio'
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    const totalPedido = Number(total);

    if (!Number.isFinite(totalPedido) || totalPedido <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El total del pedido no es válido'
      });
    }

    /*
    ==============================
    CONEXIÓN
    ==============================
    */

    connection = await db.pool.getConnection();

    await connection.beginTransaction();

    /*
    ==============================
    NÚMERO DE PEDIDO
    ==============================
    */

    const numeroPedido =
        order_number || `BOX-${Date.now()}`;

    /*
    ==============================
    INSERTAR PEDIDO
    ==============================
    */

    // Genera el número de orden
    const orderNumber = `BOX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const [pedidoResult] = await connection.execute(
        `
          INSERT INTO pedidos
          (
            usuario_id,
            nombre_cliente,
            apellido_cliente,
            correo,
            telefono,
            direccion,
            total,
            order_number
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          usuario_id || null,      // 1
          nombre_cliente,          // 2
          apellido_cliente || '',  // 3
          correo,                  // 4
          telefono || '',          // 5
          direccion || '',         // 6
          totalPedido,             // 7
          orderNumber              // 8
        ]
    );

    const pedidoId = pedidoResult.insertId;

    if (!pedidoId) {
      throw new Error(
          'MySQL no devolvió el ID del pedido'
      );
    }

    console.log(
        'Pedido creado:',
        pedidoId
    );

    /*
    ==============================
    INSERTAR PRODUCTOS
    ==============================
    */

    for (const item of products) {

      const productoId =
          Number(
              item.id ??
              item.producto_id
          );

      const cantidad =
          Number(
              item.cantidad ??
              item.quantity ??
              1
          );

      const precio =
          Number(
              item.precio ??
              item.price ??
              0
          );

      if (!Number.isInteger(productoId)) {

        throw new Error(
            `Producto inválido: ${JSON.stringify(item)}`
        );

      }

      if (!Number.isInteger(cantidad) || cantidad <= 0) {

        throw new Error(
            `Cantidad inválida para producto ${productoId}`
        );

      }

      if (!Number.isFinite(precio) || precio < 0) {

        throw new Error(
            `Precio inválido para producto ${productoId}`
        );

      }

      await connection.execute(
          `
                INSERT INTO pedido_productos
                (
                    pedido_id,
                    producto_id,
                    cantidad,
                    precio_unitario
                )
                VALUES (?, ?, ?, ?)
                `,
          [
            pedidoId,
            productoId,
            cantidad,
            precio
          ]
      );

    }

    /*
    ==============================
    CONFIRMAR TRANSACCIÓN
    ==============================
    */

    await connection.commit();

    console.log(
        'Pedido guardado correctamente:',
        pedidoId
    );

    res.status(201).json({

      success: true,

      message:
          'Pedido guardado correctamente',

      data: {

        orderId: pedidoId,

        orderNumber: numeroPedido,

        total: totalPedido,

        estado: 'pendiente'

      }

    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
        'ERROR GUARDANDO PEDIDO:',
        error
    );

    res.status(500).json({

      success: false,

      message:
          'No se pudo guardar el pedido',

      error:
      error.message

    });

  } finally {

    if (connection) {
      connection.release();
    }

  }

});


/*
==================================================
LISTAR PEDIDOS
GET /api/orders/listar
==================================================
*/

router.get('/listar', async (req, res) => {

  try {

    const pedidos = await db.query(
        `
          SELECT
            p.*,

            COUNT(pp.id)
              AS total_items,

            GROUP_CONCAT(
                CONCAT(
                    'Producto ',
                    pp.producto_id,
                    ' x',
                    pp.cantidad
                )
                  SEPARATOR ', '
            )
              AS productos_list

          FROM pedidos p

                 LEFT JOIN pedido_productos pp
                           ON p.id = pp.pedido_id

          GROUP BY p.id

          ORDER BY p.creado_en DESC
        `
    );

    res.json({

      success: true,

      count: pedidos.length,

      data: pedidos

    });

  } catch (error) {

    console.error(
        'ERROR LISTANDO PEDIDOS:',
        error
    );

    res.status(500).json({

      success: false,

      message:
          'No se pudieron obtener los pedidos',

      error:
      error.message

    });

  }

});


/*
==================================================
OBTENER PEDIDO
GET /api/orders/:id
==================================================
*/

router.get('/:id', async (req, res) => {

  try {

    const id =
        Number(req.params.id);

    if (!Number.isInteger(id)) {

      return res.status(400).json({

        success: false,

        message:
            'ID de pedido inválido'

      });

    }

    const pedidos = await db.query(
        `
            SELECT
                p.*

            FROM pedidos p

            WHERE p.id = ?
            `,
        [id]
    );

    if (pedidos.length === 0) {

      return res.status(404).json({

        success: false,

        message:
            'Pedido no encontrado'

      });

    }

    const productos = await db.query(
        `
          SELECT
            pp.*,

            pr.nombre
              AS producto_nombre

          FROM pedido_productos pp

                 LEFT JOIN productos pr
                           ON pp.producto_id = pr.id

          WHERE pp.pedido_id = ?
        `,
        [id]
    );

    res.json({

      success: true,

      data: {

        pedido: pedidos[0],

        productos

      }

    });

  } catch (error) {

    console.error(
        'ERROR OBTENIENDO PEDIDO:',
        error
    );

    res.status(500).json({

      success: false,

      message:
          'Error al obtener pedido',

      error:
      error.message

    });

  }

});


/*
==================================================
ACTUALIZAR ESTADO
PUT /api/orders/:id/estado
==================================================
*/

router.put('/:id/estado', async (req, res) => {

  try {

    const id =
        Number(req.params.id);

    const { estado } =
        req.body;

    const estadosValidos = [

      'pendiente',
      'pagado',
      'enviado',
      'entregado',
      'cancelado'

    ];

    if (!estadosValidos.includes(estado)) {

      return res.status(400).json({

        success: false,

        message:
            `Estado inválido. Usa: ${estadosValidos.join(', ')}`

      });

    }

    const result =
        await db.query(
            `
              UPDATE pedidos

              SET estado = ?

              WHERE id = ?
            `,
            [
              estado,
              id
            ]
        );

    if (result.affectedRows === 0) {

      return res.status(404).json({

        success: false,

        message:
            'Pedido no encontrado'

      });

    }

    res.json({

      success: true,

      message:
          'Estado actualizado correctamente',

      data: {

        id,

        estado

      }

    });

  } catch (error) {

    console.error(
        'ERROR ACTUALIZANDO ESTADO:',
        error
    );

    res.status(500).json({

      success: false,

      message:
          'Error al actualizar estado',

      error:
      error.message

    });

  }

});


module.exports = router;