-- ============================================
-- CRM MSDN Consulting - Seed Data
-- Données de test pour développement
-- ============================================

-- Utilisateurs de test
-- Mot de passe pour tous: "password123" (hashé avec bcrypt)
-- Hash: $2a$10$rKvVJvH8c8vJ9tZX8YqN5eK5J7K5J7K5J7K5J7K5J7K5J7K5J7K5J
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@msdn-consulting.fr', '$2a$10$rKvVJvH8c8vJ9tZX8YqN5eK5J7K5J7K5J7K5J7K5J7K5J7K5J7K5J', 'Thomas', 'Dubois', 'admin'),
('alex.martin@msdn-consulting.fr', '$2a$10$rKvVJvH8c8vJ9tZX8YqN5eK5J7K5J7K5J7K5J7K5J7K5J7K5J7K5J', 'Alex', 'Martin', 'collaborateur'),
('alexandre.v@msdn-consulting.fr', '$2a$10$rKvVJvH8c8vJ9tZX8YqN5eK5J7K5J7K5J7K5J7K5J7K5J7K5J7K5J', 'Alexandre', 'Valentin', 'collaborateur');

-- Leads de test
INSERT INTO leads (user_id, first_name, last_name, full_name, email, phone, company, position, linkedin_url, status, tags, last_activity_at) VALUES
(2, 'Sophie', 'Martin', 'Sophie Martin', 'sophie.martin@techsolutions.com', '+33 6 12 34 56 78', 'TechSolutions', 'Directrice Marketing', 'https://linkedin.com/in/sophiemartin', 'nouveau', '["SaaS", "Paris"]', datetime('now', '-2 hours')),
(2, 'Jean', 'Dupont', 'Jean Dupont', 'jean.dupont@dupont-sa.fr', '+33 6 23 45 67 89', 'Dupont SA', 'CEO', 'https://linkedin.com/in/jeandupont', 'en_cours', '["Industrie", "Lyon"]', datetime('now', '-1 day')),
(2, 'Marie', 'Curie', 'Marie Curie', 'marie.curie@sciencecorp.com', '+33 6 34 56 78 90', 'Science Corp', 'Directrice Innovation', NULL, 'gagne', '["Recherche", "Paris"]', datetime('now', '-3 days')),
(2, 'Lucas', 'Bernard', 'Lucas Bernard', 'lucas.bernard@innovatech.fr', '+33 6 45 67 89 01', 'Innovatech', 'Responsable Commercial', NULL, 'nouveau', '["Tech", "Nantes"]', datetime('now', '-5 days')),
(2, 'Emma', 'Petit', 'Emma Petit', 'emma.petit@greenenergy.com', '+33 6 56 78 90 12', 'Green Energy', 'Directrice Développement', NULL, 'perdu', '["Energie", "Bordeaux"]', datetime('now', '-16 days'));

-- Lead supplémentaire pour Alexandre
INSERT INTO leads (user_id, first_name, last_name, full_name, email, phone, company, position, status, tags, last_activity_at) VALUES
(3, 'Martin', 'Dupont', 'Martin Dupont', 'martin.d@techsolutions.fr', '+33 6 12 34 58 78', 'TechSolutions', 'Directeur Commercial', 'en_cours', '["SaaS", "Paris", "Entraid"]', datetime('now', '-2 days'));

-- Tâches de test
INSERT INTO tasks (title, description, status, priority, due_at, user_id, lead_id) VALUES
('Relancer Mr. Michel pour le devis', 'Suite à notre rencontre du salon Tech...', 'a_faire', 'haute', datetime('now', '+2 hours'), 2, 1),
('Préparer la démo produit', 'Adapter la démo pour le secteur industriel', 'en_cours', 'normale', datetime('now', '+1 day'), 2, 2),
('Envoyer contrat finalisé', 'Contrat signé, envoyer la version finale', 'a_faire', 'normale', datetime('now', '+3 days'), 2, 3),
('Appeler pour feedback', 'Comprendre les raisons du refus', 'a_faire', 'basse', datetime('now', '-1 day'), 2, 5),
('Démo produit - Exelcia', 'Présentation complète avec équipe technique', 'a_faire', 'haute', datetime('now', '+6 hours'), 2, NULL);

-- Tâche pour Alexandre
INSERT INTO tasks (title, description, status, priority, due_at, user_id, lead_id) VALUES
('Suivre budget estimé 50k€', 'Lead capturé via formulaire web "Pricing"', 'en_cours', 'haute', datetime('now', '+3 days'), 3, 6);

-- Activités récentes
INSERT INTO activities (user_id, lead_id, activity_type, title, description, metadata) VALUES
(2, 1, 'call_made', 'Appel sortant', 'Discussion productive sur nos intégrations en CRM. Martin est intéressé par la fonctionnalité de reporting avancé. Il a demandé une démo pour la semaine prochaine avec équipe technique.', '{"duration": "15min", "outcome": "positive"}'),
(2, 1, 'email_sent', 'Email envoyé', 'Bonjour Martin, suite à notre rencontre au salon Tech...', '{"subject": "Suite salon Tech", "sent_at": "' || datetime('now', '-2 hours') || '"}'),
(2, 6, 'note_added', 'Note interne', 'Lead capturé via la formulaire web "Pricing". Budget estimé : 50k€.', NULL),
(3, 6, 'status_changed', 'Statut modifié', 'Nouveau → En négociation', '{"old_status": "nouveau", "new_status": "en_cours"}');
