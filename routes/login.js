const express = require('express');
const database = require('../config/database');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    // Buscamos por email O por nombre de usuario
    const search = email || nombre;
    if (!search || !password) return res.status(400).json({ error: 'Faltan datos' });

    // ✅ SIN CORCHETES
    const usuarios = await database.query(
        'SELECT * FROM usuarios WHERE email = ? OR nombre = ?',
        [search, search]
    );

    const usuario = usuarios[0];

    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Tu base de datos guarda la contraseña '12345' en texto plano (password_hash)
    const passValida = (password === usuario.password_hash);

    if (!passValida) return res.status(401).json({ error: 'Credenciales inválidas' });

    res.json({
      success: true,
      message: 'Login exitoso',
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;