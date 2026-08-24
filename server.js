const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const ordersRouter = require('./routes/orders');

app.use('/api/orders', ordersRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/test', async (req, res) => {
  try {
    const db = require('./database');
    await db.query('SELECT 1');

    res.json({
      success: true,
      message: 'Servidor y MySQL funcionando correctamente'
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error de conexión con MySQL',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});