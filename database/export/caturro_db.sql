-- MySQL dump 10.13  Distrib 8.0.44, for Linux (aarch64)
--
-- Host: localhost    Database: caturro_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(255) NOT NULL,
  `semestre` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `cedula` varchar(32) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `puntos` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `cedula` (`cedula`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Nicolas Duran Garces','10° Semestre','2025-10-25 17:33:10','2025-10-25 18:07:13','1004917211','$2b$12$QnnYxUnWcHPhc4cqTrnde.cmwj.rEgG12qZ3OPn0GqiE0SFF6O6ZG',100);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_puntos`
--

DROP TABLE IF EXISTS `movimientos_puntos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos_puntos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `cambio` int NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `ix_movimientos_puntos_id` (`id`),
  CONSTRAINT `movimientos_puntos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_puntos`
--

LOCK TABLES `movimientos_puntos` WRITE;
/*!40000 ALTER TABLE `movimientos_puntos` DISABLE KEYS */;
INSERT INTO `movimientos_puntos` VALUES (1,1,100,'','2025-10-25 18:07:13');
/*!40000 ALTER TABLE `movimientos_puntos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promociones`
--

DROP TABLE IF EXISTS `promociones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promociones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `probabilidad` decimal(5,2) NOT NULL DEFAULT '10.00',
  `activa` tinyint(1) NOT NULL DEFAULT '1',
  `color` char(7) NOT NULL DEFAULT '#4B5563',
  `icono` varchar(16) NOT NULL DEFAULT 'ðŸŽ',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promociones`
--

LOCK TABLES `promociones` WRITE;
/*!40000 ALTER TABLE `promociones` DISABLE KEYS */;
INSERT INTO `promociones` VALUES (1,'Cafe Gratis','Americano Gratis',20.00,1,'#111827','☕️','2025-10-25 17:24:30','2025-10-25 18:01:33'),(2,'Descuento 20%','20 % de Descuento en tu compra',17.00,1,'#1F2937','🫦','2025-10-25 17:24:30','2025-10-25 18:06:58'),(3,'Hojaldre Gratis','Un Hojaldre Gratis (Sujeto a Disponibilidad ))',5.00,1,'#374151','🥖','2025-10-25 17:24:30','2025-10-25 18:05:06'),(4,'Combo Especial','Cafe y Pastel',3.00,1,'#4B5563','🥖☕️','2025-10-25 17:24:30','2025-10-25 18:06:43'),(5,'Sigue Intentando','Una Loca, Suerte a la Proxima',30.00,1,'#6B7280','🐷','2025-10-25 17:24:30','2025-10-25 18:06:32');
/*!40000 ALTER TABLE `promociones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registros_ruleta`
--

DROP TABLE IF EXISTS `registros_ruleta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registros_ruleta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `promocion_id` int NOT NULL,
  `fecha_giro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `promocion_id` (`promocion_id`),
  CONSTRAINT `registros_ruleta_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `registros_ruleta_ibfk_2` FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registros_ruleta`
--

LOCK TABLES `registros_ruleta` WRITE;
/*!40000 ALTER TABLE `registros_ruleta` DISABLE KEYS */;
INSERT INTO `registros_ruleta` VALUES (1,1,4,'2025-10-25 17:33:50');
/*!40000 ALTER TABLE `registros_ruleta` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-25 13:08:49
