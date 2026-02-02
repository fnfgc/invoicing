-- Full MySQL Migration Dump (Single DB Strategy)
-- Generated on 2026-02-02T16:32:02.580Z

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Master Database Structure
-- --------------------------------------------------------

DROP TABLE IF EXISTS `user_lookup`;
DROP TABLE IF EXISTS `tenants`;
DROP TABLE IF EXISTS `packages`;
DROP TABLE IF EXISTS `tenant_1_users`;
DROP TABLE IF EXISTS `tenant_1_products`;
DROP TABLE IF EXISTS `tenant_1_invoices`;
DROP TABLE IF EXISTS `tenant_1_settings`;

CREATE TABLE IF NOT EXISTS `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `features` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `plan` varchar(255) DEFAULT 'free',
  `subscription_expiry` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_lookup` (
  `username` varchar(255) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  PRIMARY KEY (`username`),
  KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `user_lookup_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Master Data Injection
-- --------------------------------------------------------

INSERT INTO `packages` (`id`, `name`, `price`, `duration_days`, `features`) VALUES
(1, 'Trial', 0.00, 14, '["Basic POS","50 Products"]'),
(2, 'Monthly', 29.99, 30, '["Unlimited POS","Unlimited Products","Email Support"]'),
(3, 'Yearly', 299.99, 365, '["All Features","Priority Support"]');

INSERT INTO `tenants` (`id`, `business_name`, `email`, `password`, `plan`, `is_active`) VALUES
(999, 'Super Admin', 'superadmin@fnf.com', '$2b$10$hxUMW.8DwA3ZuMucVn80Ye3PTyiybDiPJ9bpWhUs62xEIMn1qa/Qi', 'unlimited', 1),
(1, 'Legacy Store', 'legacy@store.com', '$2b$10$hxUMW.8DwA3ZuMucVn80Ye3PTyiybDiPJ9bpWhUs62xEIMn1qa/Qi', 'unlimited', 1);

-- --------------------------------------------------------
-- Tenant 1 (Legacy) Table Structure (Prefix Strategy)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tenant_1_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'cashier',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tenant_1_products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT '0',
  `pctCode` varchar(50) DEFAULT NULL,
  `taxRate` decimal(5,2) DEFAULT '17.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tenant_1_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoiceNumber` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `buyerName` varchar(255) DEFAULT NULL,
  `buyerCNIC` varchar(50) DEFAULT NULL,
  `buyerNTN` varchar(50) DEFAULT NULL,
  `buyerPhone` varchar(50) DEFAULT NULL,
  `fbrResponse` text,
  `items` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoiceNumber` (`invoiceNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tenant_1_settings` (
  `key` varchar(255) NOT NULL,
  `value` text,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `tenant_1_users` (`name`, `username`, `password`, `role`) VALUES
('Super Admin', 'admin', 'admin123', 'admin'),
('Cashier One', 'cashier', '123', 'cashier'),
('Stock Manager', 'stock', '123', 'stock_manager');

INSERT INTO `user_lookup` (`username`, `tenant_id`) VALUES
('admin', 1),
('cashier', 1),
('stock', 1);

INSERT INTO `tenant_1_products` (`name`, `price`, `stock`, `pctCode`, `taxRate`) VALUES
('Green Tea', 150, 50, NULL, 17),
('Sugar (1kg)', 120, 99, NULL, 17),
('Milk (1L)', 200, 21, NULL, 17),
('Biscuits', 50, 196, NULL, 17),
('Soap', 85, 33, NULL, 17);

INSERT INTO `tenant_1_invoices` (`invoiceNumber`, `date`, `totalAmount`, `buyerName`, `buyerCNIC`, `buyerNTN`, `buyerPhone`, `fbrResponse`, `items`) VALUES
(NULL, '2026-01-30T17:34:29.900Z', undefined, NULL, NULL, NULL, NULL, NULL, '[{"product_id":null,"name":"Unknown","price":120,"quantity":1,"total":120},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":150,"quantity":1,"total":150},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200},{"product_id":null,"name":"Unknown","price":200,"quantity":17,"total":3400},{"product_id":null,"name":"Unknown","price":50,"quantity":2,"total":100},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200}]'),
(NULL, '2026-01-30T19:36:53.247Z', undefined, NULL, NULL, NULL, NULL, NULL, '[{"product_id":null,"name":"Unknown","price":120,"quantity":1,"total":120},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":150,"quantity":1,"total":150},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200},{"product_id":null,"name":"Unknown","price":200,"quantity":17,"total":3400},{"product_id":null,"name":"Unknown","price":50,"quantity":2,"total":100},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200}]'),
(NULL, '2026-01-30T19:40:37.763Z', undefined, NULL, NULL, NULL, NULL, NULL, '[{"product_id":null,"name":"Unknown","price":120,"quantity":1,"total":120},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":150,"quantity":1,"total":150},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200},{"product_id":null,"name":"Unknown","price":200,"quantity":17,"total":3400},{"product_id":null,"name":"Unknown","price":50,"quantity":2,"total":100},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200}]'),
(NULL, '2026-01-31T02:11:27.388Z', undefined, NULL, NULL, NULL, NULL, NULL, '[{"product_id":null,"name":"Unknown","price":120,"quantity":1,"total":120},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":150,"quantity":1,"total":150},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200},{"product_id":null,"name":"Unknown","price":200,"quantity":17,"total":3400},{"product_id":null,"name":"Unknown","price":50,"quantity":2,"total":100},{"product_id":null,"name":"Unknown","price":85,"quantity":1,"total":85},{"product_id":null,"name":"Unknown","price":50,"quantity":1,"total":50},{"product_id":null,"name":"Unknown","price":200,"quantity":1,"total":200}]');

INSERT INTO `tenant_1_settings` (`key`, `value`) VALUES
('license_key', 'FNF-PRO-C5D8-3643'),
('business_name', 'Test Business'),
('business_address', '123 Test St'),
('business_contact', '1234567890'),
('business_ntn', '1234567'),
('business_strn', '1234567890123');

SET FOREIGN_KEY_CHECKS = 1;
