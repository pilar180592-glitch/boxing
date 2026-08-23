CREATE DATABASE IF NOT EXISTS boxing_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE boxing_store;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  imagen_url MEDIUMTEXT,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  nombre_cliente VARCHAR(120) NOT NULL,
  apellido_cliente VARCHAR(120) NOT NULL,
  segundo_apellido VARCHAR(120) NOT NULL,
  correo VARCHAR(190) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  direccion TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  estado ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS pedido_productos (
  pedido_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (pedido_id, producto_id),
  CONSTRAINT fk_pedido_productos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_productos_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

INSERT INTO usuarios (nombre, email, password_hash, rol)
SELECT 'admin', 'admin@boxing.store', '12345', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre = 'admin' OR email = 'admin@boxing.store');

INSERT INTO productos (nombre, descripcion, precio, stock)
SELECT 'Guantes de boxeo 12 oz', 'Guantes para entrenamiento.', 49.99, 20
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Guantes de boxeo 12 oz');
