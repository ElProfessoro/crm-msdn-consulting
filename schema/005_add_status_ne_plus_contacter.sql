-- ============================================
-- CRM MSDN Consulting - Migration 005
-- Ajout du statut RGPD "ne_plus_contacter"
-- ============================================

-- SQLite ne supporte pas ALTER CONSTRAINT directement
-- On doit recréer la table avec la nouvelle contrainte

-- 1. Créer une nouvelle table temporaire avec la contrainte mise à jour
CREATE TABLE IF NOT EXISTS leads_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    company TEXT,
    position TEXT,
    linkedin_url TEXT,
    status TEXT NOT NULL DEFAULT 'nouveau' CHECK(status IN ('nouveau', 'en_cours', 'gagne', 'perdu', 'ne_plus_contacter')),
    tags TEXT,
    notes TEXT,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Copier toutes les données existantes
INSERT INTO leads_new SELECT * FROM leads;

-- 3. Supprimer l'ancienne table
DROP TABLE leads;

-- 4. Renommer la nouvelle table
ALTER TABLE leads_new RENAME TO leads;

-- 5. Recréer les index
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company ON leads(company);
CREATE INDEX idx_leads_updated_at ON leads(updated_at);
