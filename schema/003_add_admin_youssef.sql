-- ============================================
-- Ajout utilisateur admin: Youssef Msalla
-- Email: msalla.youssef@gmail.com
-- ============================================

INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
  'msalla.youssef@gmail.com',
  '$sha256$d1e10a401f1a0e3069936061e56aa62bfa3b4cb5295a8efd87c80e9d8f8aed40',
  'Youssef',
  'Msalla',
  'admin'
);
