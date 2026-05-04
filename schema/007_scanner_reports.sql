-- ============================================
-- Migration 007 : Intégration RGPD Scanner
-- Stocke les résultats de pré-audit scanner
-- ============================================

-- Ajout du site web sur les leads (pour faire le lien avec les scans)
ALTER TABLE leads ADD COLUMN website_url TEXT;

-- Table scanner_reports : 1 ligne par scan, liée optionnellement à un lead
CREATE TABLE IF NOT EXISTS scanner_reports (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id               INTEGER,              -- NULL si aucun lead correspondant
  domain                TEXT NOT NULL,        -- ex: akromeca.fr
  url                   TEXT NOT NULL,        -- URL complète scannée
  company_name          TEXT,                 -- Nom de l'entreprise
  scanned_at            DATETIME NOT NULL,    -- Date du scan (depuis le scanner)
  duration_ms           INTEGER,              -- Durée en ms
  status                TEXT NOT NULL DEFAULT 'completed', -- completed | failed | partial
  -- Indicateurs clés (calculés côté scanner)
  score                 INTEGER,              -- 0-100
  risk_level            TEXT,                 -- faible | moyen | eleve | critique
  findings_count        INTEGER DEFAULT 0,
  has_privacy_policy    INTEGER DEFAULT 0,    -- 0/1
  has_consent_banner    INTEGER DEFAULT 0,    -- 0/1
  cookies_count         INTEGER DEFAULT 0,
  trackers_count        INTEGER DEFAULT 0,
  missing_headers_count INTEGER DEFAULT 0,
  -- Données détaillées (JSON)
  findings_json         TEXT,                 -- Array complet des findings
  detected_saas         TEXT,                 -- JSON array des SaaS détectés
  missing_headers       TEXT,                 -- JSON array des headers manquants
  -- Méta
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scanner_reports_lead_id  ON scanner_reports(lead_id);
CREATE INDEX IF NOT EXISTS idx_scanner_reports_domain   ON scanner_reports(domain);
CREATE INDEX IF NOT EXISTS idx_scanner_reports_scanned  ON scanner_reports(scanned_at);
