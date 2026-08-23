const mysql = require('mysql2');
require('dotenv').config();

// Verificar que las variables de entorno existan
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  console.error('❌ Error: Faltan variables de entorno en .env');
  console.error('Asegúrate de tener: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convertir a promesas para usar async/await
const database = pool.promise();

// Probar conexión
(async () => {
  try {
    const [rows] = await database.query('SELECT 1');
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    console.error('Verifica que MySQL esté corriendo y las credenciales sean correctas');
    process.exit(1);
  }
})();

module.exports = database;