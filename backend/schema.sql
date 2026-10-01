-- ============================================================
-- Yearbook Project — MySQL schema
-- Conventions applied to every table:
--   * soft delete via `is_deleted` + `deleted_at`
--   * audit columns: created_at, updated_at, created_by, updated_by
-- ============================================================

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS yearbook_db CHARACTER SET utf8mb4;
USE yearbook_db;

-- ------------------------------------------------------------
-- allowed_email_domains
-- Super admin controls which IITG email domains can register.
-- ------------------------------------------------------------
CREATE TABLE allowed_email_domains (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    domain          VARCHAR(191) NOT NULL UNIQUE,   -- e.g. 'iitg.ac.in'
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL
);

-- ------------------------------------------------------------
-- students
-- Pre-loaded roster (by admin/super admin, manual or excel import).
-- Registration matches against this table before a `users` row is created.
-- ------------------------------------------------------------
CREATE TABLE students (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    batch_year      SMALLINT UNSIGNED NOT NULL,
    name            VARCHAR(191) NOT NULL,
    roll_no         VARCHAR(50) NOT NULL,
    iitg_email      VARCHAR(191) NOT NULL,
    is_registered   TINYINT(1) NOT NULL DEFAULT 0,   -- flips true once matched user exists
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL,
    UNIQUE KEY uq_students_roll_batch (roll_no, batch_year, is_deleted)
);
CREATE INDEX idx_students_batch_year ON students(batch_year);
CREATE INDEX idx_students_email ON students(iitg_email);

-- ------------------------------------------------------------
-- users
-- access_type: 1 super admin, 2 admin, 3 coordinator, 4 user (default)
-- ------------------------------------------------------------
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT UNSIGNED NULL,             -- FK -> students.id (matched roster row)
    name            VARCHAR(191) NOT NULL,
    roll_no         VARCHAR(50) NOT NULL,
    email           VARCHAR(191) NOT NULL UNIQUE,
    batch_year      SMALLINT UNSIGNED NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    access_type     TINYINT UNSIGNED NOT NULL DEFAULT 4,  -- 1/2/3/4
    is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    approved_by     BIGINT UNSIGNED NULL,              -- FK -> users.id
    approved_at     DATETIME NULL,
    last_update     DATETIME NULL,                     -- per spec: last profile self-update time
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL,
    CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id)
);
CREATE INDEX idx_users_access_type ON users(access_type);
CREATE INDEX idx_users_batch_year ON users(batch_year);

-- ------------------------------------------------------------
-- user_details
-- All profile content + photo state lives here (1:1 with users).
-- Photo approval workflow: *_current_* is what's shown on the home page.
-- *_pending_* is awaiting admin/coordinator/super-admin action.
-- ------------------------------------------------------------
CREATE TABLE user_details (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT UNSIGNED NOT NULL UNIQUE,

    -- profile photo (home page card)
    profile_photo_current   VARCHAR(500) NULL,
    profile_photo_pending   VARCHAR(500) NULL,
    profile_photo_status    ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none',
    profile_photo_reviewed_by BIGINT UNSIGNED NULL,
    profile_photo_reviewed_at DATETIME NULL,
    profile_photo_reject_reason VARCHAR(500) NULL,

    -- feature photo (student detail page)
    feature_photo_current   VARCHAR(500) NULL,
    feature_photo_pending   VARCHAR(500) NULL,
    feature_photo_status    ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none',
    feature_photo_reviewed_by BIGINT UNSIGNED NULL,
    feature_photo_reviewed_at DATETIME NULL,
    feature_photo_reject_reason VARCHAR(500) NULL,

    quote                   VARCHAR(500) NULL,          -- mandatory at submit-time (enforced in service layer)
    tagline                 VARCHAR(255) NULL,
    about                   TEXT NULL,

    physics_like            TEXT NULL,
    area_of_interest        VARCHAR(255) NULL,
    hobbies                 TEXT NULL,
    proud_of                TEXT NULL,

    phd                     VARCHAR(255) NULL,           -- optional
    academic                VARCHAR(255) NULL,           -- optional
    jobs                    VARCHAR(255) NULL,           -- optional

    linkedin                VARCHAR(255) NULL,
    instagram               VARCHAR(255) NULL,

    footer_quote            VARCHAR(255) NULL,

    -- position of responsibility, set by coordinator/admin/super admin
    position_title          VARCHAR(100) NULL,           -- e.g. 'CR', 'DPR', free text allowed
    position_set_by         BIGINT UNSIGNED NULL,
    position_set_at         DATETIME NULL,

    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by              BIGINT UNSIGNED NULL,
    updated_by              BIGINT UNSIGNED NULL,
    is_deleted              TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at              DATETIME NULL,
    CONSTRAINT fk_user_details_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- additional_photos (core-memory-style photo gallery, unbounded per user)
-- ------------------------------------------------------------
CREATE TABLE additional_photos (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    photo_url       VARCHAR(500) NOT NULL,
    caption         VARCHAR(255) NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL,
    CONSTRAINT fk_add_photos_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- core_memories
-- ------------------------------------------------------------
CREATE TABLE core_memories (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(191) NULL,
    memory_text     TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL,
    CONSTRAINT fk_core_memories_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE core_memory_photos (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    core_memory_id  BIGINT UNSIGNED NOT NULL,
    photo_url       VARCHAR(500) NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL,
    CONSTRAINT fk_cm_photos_memory FOREIGN KEY (core_memory_id) REFERENCES core_memories(id)
);

-- ------------------------------------------------------------
-- otp_requests — used for both registration email verification
-- and forgot-password flows.
-- ------------------------------------------------------------
CREATE TABLE otp_requests (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(191) NOT NULL,
    otp_hash        VARCHAR(255) NOT NULL,
    purpose         ENUM('registration','password_reset') NOT NULL,
    expires_at      DATETIME NOT NULL,
    consumed_at     DATETIME NULL,
    attempt_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL
);
CREATE INDEX idx_otp_email_purpose ON otp_requests(email, purpose);

-- ------------------------------------------------------------
-- user_notifications — messages to a user (e.g. "image rejected")
-- ------------------------------------------------------------
CREATE TABLE user_notifications (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    message         VARCHAR(500) NOT NULL,
    is_read         TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- excel_import_batches — audit trail for bulk student uploads
-- ------------------------------------------------------------
CREATE TABLE excel_import_batches (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name       VARCHAR(255) NOT NULL,
    total_rows      INT NOT NULL DEFAULT 0,
    success_rows    INT NOT NULL DEFAULT 0,
    failed_rows     INT NOT NULL DEFAULT 0,
    error_log       TEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at      DATETIME NULL
);

-- ------------------------------------------------------------
-- Seed: super admin placeholder + a default allowed domain.
-- Password hash below is a placeholder — replace via the seed script,
-- which hashes a real password with bcrypt before insert.
-- ------------------------------------------------------------
INSERT INTO allowed_email_domains (domain, is_active, created_by, updated_by)
VALUES ('iitg.ac.in', 1, NULL, NULL);
