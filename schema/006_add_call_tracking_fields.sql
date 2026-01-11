-- Migration pour ajouter les champs de suivi des appels RingOver
-- Ajout de champs pour stocker les informations détaillées des appels

-- Ajouter les colonnes pour le suivi des appels dans activities
ALTER TABLE activities ADD COLUMN call_id TEXT;
ALTER TABLE activities ADD COLUMN channel_id TEXT;
ALTER TABLE activities ADD COLUMN call_duration INTEGER;
ALTER TABLE activities ADD COLUMN call_status TEXT; -- 'ringing', 'answered', 'missed', 'ended'
ALTER TABLE activities ADD COLUMN recording_url TEXT;
ALTER TABLE activities ADD COLUMN call_direction TEXT; -- 'inbound', 'outbound'
ALTER TABLE activities ADD COLUMN from_number TEXT;
ALTER TABLE activities ADD COLUMN to_number TEXT;

-- Créer un index sur call_id pour retrouver rapidement les activités liées à un appel
CREATE INDEX IF NOT EXISTS idx_activities_call_id ON activities(call_id);
