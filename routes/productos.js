const express = require('express');
const db = require('../database'); // 👈 Cambiamos a la carpeta database

const router = express.Router();

router.get('/', async (request, response, next) => {
  try {
    // 👈 SIN CORCHETES. Esto arregla el error "not iterable"
    const productos = await db.query(
        'SELECT id, nombre, descripcion, precio, stock, imagen_url AS imagen FROM productos ORDER BY id DESC'
    );
    response.json(productos);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    const { nombre, descripcion, precio, stock = 0, imagen, imagen_url: imagenUrl } = request.body;
    const image = imagen || imagenUrl;
    if (!nombre || !Number.isFinite(Number(precio)) || Number(precio) < 0 || !image) {
      return response.status(400).json({ error: 'nombre, precio e imagen son obligatorios' });
    }
    const result = await db.query(
        'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES (?, ?, ?, ?, ?)',
        [nombre, descripcion || null, Number(precio), Number(stock), image]
    );
    response.status(201).json({ id: result.insertId, nombre, descripcion, precio: Number(precio), stock: Number(stock), imagen: image });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    const { nombre, descripcion, precio, stock = 0, imagen, imagen_url: imagenUrl } = request.body;
    const image = imagen || imagenUrl;
    if (!nombre || !Number.isFinite(Number(precio)) || Number(precio) < 0 || !image) {
      return response.status(400).json({ error: 'nombre, precio e imagen son obligatorios' });
    }
    const result = await db.query(
        'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen_url = ? WHERE id = ?',
        [nombre, descripcion || null, Number(precio), Number(stock), image, request.params.id]
    );
    if (!result.affectedRows) return response.status(404).json({ error: 'Producto no encontrado' });
    response.json({ message: 'Producto actualizado' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const result = await db.query('DELETE FROM productos WHERE id = ?', [request.params.id]);
    if (!result.affectedRows) return response.status(404).json({ error: 'Producto no encontrado' });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;