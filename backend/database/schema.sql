-- =====================================================================
-- MediSync - Smart Medication Management & Reminder System
-- College BCA Major Project Database Schema
-- Database: MySQL 8.0+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS medisync_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medisync_db;

-- Disable foreign key checks for clean teardown/rebuild if needed
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS stock_refills;
DROP TABLE IF EXISTS dose_logs;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Table: users
-- Stores registered patient / caregiver user accounts with hashed credentials
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: notification_settings
-- Stores user preferences for reminder notifications, alerts, sound & lead times
-- ---------------------------------------------------------------------
CREATE TABLE notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    browser_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    lead_time_minutes INT NOT NULL DEFAULT 10,
    snooze_duration_minutes INT NOT NULL DEFAULT 15,
    email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: medicines
-- Stores user medication profiles, schedules, forms, dosage and inventory
-- ---------------------------------------------------------------------
CREATE TABLE medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    form VARCHAR(50) NOT NULL DEFAULT 'Tablet',
    frequency VARCHAR(50) NOT NULL DEFAULT 'Once daily',
    scheduled_times JSON NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    quantity INT NOT NULL DEFAULT 0,
    refill_threshold INT NOT NULL DEFAULT 5,
    instructions VARCHAR(100) NOT NULL DEFAULT 'After food',
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_med_user_active (user_id, is_active),
    INDEX idx_med_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: dose_logs
-- Records every scheduled dose occurrence and its action (taken, skipped, snoozed, missed)
-- UNIQUE index on (medicine_id, scheduled_date, scheduled_time) guarantees no duplicates!
-- ---------------------------------------------------------------------
CREATE TABLE dose_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(10) NOT NULL,
    status ENUM('taken', 'skipped', 'snoozed', 'missed') NOT NULL DEFAULT 'missed',
    action_timestamp TIMESTAMP NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dose_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_dose_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    UNIQUE KEY uq_dose_occurrence (medicine_id, scheduled_date, scheduled_time),
    INDEX idx_dose_user_date (user_id, scheduled_date),
    INDEX idx_dose_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: stock_refills
-- Keeps an audit trail of medicine inventory additions
-- ---------------------------------------------------------------------
CREATE TABLE stock_refills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity_added INT NOT NULL,
    refill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255) NULL,
    CONSTRAINT fk_refill_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refill_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    INDEX idx_refill_med (medicine_id),
    INDEX idx_refill_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

