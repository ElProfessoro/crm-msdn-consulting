// ============================================
// Types TypeScript pour l'API
// ============================================

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  JWT_SECRET: string;
  RINGOVER_API_KEY: string;
  SCANNER_API_KEY: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'collaborateur' | 'admin';
  created_at: string;
}

export interface Lead {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  linkedin_url: string | null;
  status: 'nouveau' | 'en_cours' | 'gagne' | 'perdu' | 'ne_plus_contacter';
  tags: string | null; // JSON string
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'a_faire' | 'en_cours' | 'termine';
  priority: 'basse' | 'normale' | 'haute';
  due_at: string | null;
  user_id: number;
  lead_id: number | null;
  notified: number; // 0 ou 1 (SQLite boolean)
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  user_id: number;
  lead_id: number | null;
  task_id: number | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: string | null; // JSON string
  created_at: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'collaborateur' | 'admin';
  iat?: number;
  exp?: number;
}

export interface DashboardStats {
  leads_won_month: number;
  leads_lost_month: number;
  tasks_today: number;
  conversion_rate: number;
}

export interface ScannerReport {
  id: number;
  lead_id: number | null;
  domain: string;
  url: string;
  company_name: string | null;
  scanned_at: string;
  duration_ms: number | null;
  status: 'completed' | 'failed' | 'partial';
  score: number | null;
  risk_level: 'faible' | 'moyen' | 'eleve' | 'critique' | null;
  findings_count: number;
  has_privacy_policy: number; // 0/1
  has_consent_banner: number; // 0/1
  cookies_count: number;
  trackers_count: number;
  missing_headers_count: number;
  findings_json: any[] | null;
  detected_saas: any[] | null;
  missing_headers: string[] | null;
  created_at: string;
}
