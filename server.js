require('dotenv').config();

const express = require('express');
const path = require('path');
const productosRouter = require('./routes/productos');
const loginRouter = require('./routes/login');
const carritoRouter = require('./routes/carrito');
const pedidosRouter = require('./routes/pedidos');

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

// Rutas
app.use('/api/productos', productosRouter);
app.use('/api/login', loginRouter);
app.use('/api/carrito', carritoRouter);
app.use('/api/pedidos', pedidosRouter);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Boxing Store API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz - sirve el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Manejador de errores
app.use((error, request, response, next) => {
  console.error('Error:', error);
  response.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🥊 Boxing Store ejecutándose en http://localhost:${port}`);
  console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
  console.log(`🔗 API disponible en: http://localhost:${port}/api`);
});