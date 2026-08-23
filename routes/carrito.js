const express = require('express');

const router = express.Router();
const carritos = new Map();

router.get('/:usuarioId', (request, response) => {
  response.json(carritos.get(request.params.usuarioId) || []);
});

router.post('/:usuarioId', (request, response) => {
  const { productoId, cantidad = 1 } = request.body;
  if (!productoId || cantidad < 1) return response.status(400).json({ error: 'productoId y cantidad válida son obligatorios' });

  const items = carritos.get(request.params.usuarioId) || [];
  const existingItem = items.find((item) => item.productoId === productoId);
  if (existingItem) existingItem.cantidad += cantidad;
  else items.push({ productoId, cantidad });
  carritos.set(request.params.usuarioId, items);
  response.status(201).json(items);
});

router.delete('/:usuarioId/:productoId', (request, response) => {
  const items = carritos.get(request.params.usuarioId) || [];
  const filteredItems = items.filter((item) => String(item.productoId) !== request.params.productoId);
  carritos.set(request.params.usuarioId, filteredItems);
  response.json(filteredItems);
});

module.exports = router;
