-- ============================================
-- Ajout de l'utilisateur Cédric Refray
-- Email: cedric.refray@sinexy.fr
-- Mot de passe: W=f4]!|fD&a*v!(>}lEL
-- Date: 2026-03-05
-- ============================================

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('cedric.refray@sinexy.fr', '$sha256$f72c50d6d98968659c369a338b060035ddd62bca1eae59e62fb2849507791a2d', 'Cédric', 'Refray', 'collaborateur');

-- ============================================
-- Notes :
-- - Rôle: collaborateur (peut gérer ses propres leads)
-- - Pour donner les droits admin, modifier le rôle en 'admin'
-- - Mot de passe robuste généré avec 20 caractères
-- ============================================
