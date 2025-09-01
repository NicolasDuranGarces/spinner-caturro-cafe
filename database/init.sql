CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(255) NOT NULL,
  semestre VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promociones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NULL,
  probabilidad DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  color CHAR(7) NOT NULL DEFAULT '#4B5563', -- gris por defecto
  icono VARCHAR(16) NOT NULL DEFAULT '🎁',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registros_ruleta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  promocion_id INT NOT NULL,
  fecha_giro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (promocion_id) REFERENCES promociones(id)
);

-- Semilla de promociones (ejemplo)
INSERT INTO promociones (nombre, descripcion, probabilidad, activa, color, icono) VALUES
('Café Gratis', 'Un café americano gratis', 25.00, 1, '#111827', '☕'),
('Descuento 20%', '20% de descuento en tu próxima compra', 30.00, 1, '#1F2937', '🎯'),
('Muffin Gratis', 'Un muffin de cortesía', 20.00, 1, '#374151', '🧁'),
('Combo Especial', 'Café + pastel a precio especial', 15.00, 1, '#4B5563', '🍰'),
('Sigue Intentando', '¡La próxima será!', 10.00, 1, '#6B7280', '🎲');