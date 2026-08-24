const express = require('express');
const router = express.Router();

// El carrito se gestiona 100% en el Frontend (index.html) usando localStorage.
// Dejamos esta ruta vacía pero válida para que el servidor no falle al iniciarla.
router.get('/', (req, res) => {
  res.json({ message: 'El carrito se gestiona desde el frontend.' });
});

module.exports = router;