const express = require('express');
const router = express.Router();
const database = require('../config/database');; // Asegúrate de que esta ruta sea donde está tu conexión a la BD

// Ruta de Login
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  // Validación básica de campos vacíos
  if (!correo || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
  }

  try {
    // 1. Buscar el usuario en la base de datos por correo
    // NOTA: Asegúrate de que la tabla se llame 'usuarios' y la columna 'correo'
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);

    // 2. Asignar a una variable con nombre ÚNICO (Aquí estaba el error antes)
    const usuarioEncontrado = usuarios[0];

    // 3. Validar si el usuario existe
    if (!usuarioEncontrado) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // 4. Comparar contraseña (Si usas bcrypt, cambia esto por bcrypt.compareSync)
    if (usuarioEncontrado.password !== password) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 5. Login exitoso
    res.json({
      message: 'Login exitoso',
      usuario: {
        id: usuarioEncontrado.id,
        nombre: usuarioEncontrado.nombre_cliente, // Ajusta según tu tabla
        correo: usuarioEncontrado.correo
      }
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;