// ─── Autenticación — campos reales de la API ─────────────────────────────────

export interface LoginRequest {
  username: string;   // ← API usa "username", NO "email"
  password: string;
}

export interface UserPermissions {
  dashboard: boolean;
  calls: boolean;
  queues: boolean;
  agents: boolean;
  reports: boolean;
  admin: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;             // ← API devuelve "full_name", no "name"
  is_admin: boolean;             // ← solo admins pueden gestionar usuarios
  must_change_password: boolean; // ← true tras crear/resetear: cambio obligatorio
  permissions: UserPermissions;  // ← en lugar de "role"
}

// ─── Cambio / recuperación de contraseña ────────────────────────────────────

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
  // ⚠️  La API actual NO devuelve refresh_token
  // Se maneja con re-login silencioso al expirar (ver authApi.ts)
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  // GET /api/dashboard/summary — ajustar campos cuando confirmes la respuesta real
  [key: string]: unknown;
}

// ─── Llamadas ─────────────────────────────────────────────────────────────────

export type CallDisposition = string;

export interface Call {
  callid: string;
  src: string;           // número origen
  dst: string;           // número destino / extensión
  queue: string;
  agent: string;
  duration: number;      // segundos
  billsec: number;       // segundos facturables
  disposition: CallDisposition;
  calldate: string;      // ISO datetime
  wait_time?: number;
}

export interface CallStatistics {
  total_calls: number;
  answered_calls: number;
  abandoned_calls: number;
  avg_duration: number;
  avg_wait_time: number;
  service_level?: number;
}

export interface HourlyDistribution {
  hour: number;
  total: number;
  answered: number;
  abandoned: number;
}

export interface DailySummary {
  date: string;
  total: number;
  answered: number;
  abandoned: number;
  avg_duration: number;
}

export interface CallsResponse {
  calls: Call[];
  total: number;
  page?: number;
  per_page?: number;
}

// ─── Colas (Queues) ───────────────────────────────────────────────────────────

export interface Queue {
  name: string;
  description?: string;
}

export interface QueueStatistics {
  queue: string;
  total_calls: number;
  answered: number;
  abandoned: number;
  avg_wait_time: number;
  service_level: number;
}

export interface RealtimeQueueStatus {
  queue: string;
  calls_waiting: number;
  agents_available: number;
  agents_on_call: number;
  longest_wait: number;
}

// ─── Agentes ──────────────────────────────────────────────────────────────────

export interface Agent {
  agent: string;        // identificador del agente
  name?: string;
  queue?: string;
}

export interface AgentStatistics {
  agent: string;
  total_calls: number;
  answered_calls: number;
  avg_duration: number;
  avg_wait_time: number;
  satisfaction_score?: number;
}

export interface RealtimeAgentStatus {
  agent: string;
  status: 'available' | 'on_call' | 'paused' | 'offline';
  queue?: string;
  current_call_duration?: number;
}

// ─── Grabaciones ──────────────────────────────────────────────────────────────

export interface Recording {
  callid: string;
  filename: string;
  duration: number;
  size?: number;
  url?: string;
}

export interface RecordingCheck {
  exists: boolean;
  callid: string;
}

// ─── Análisis ─────────────────────────────────────────────────────────────────

export interface DashboardEjecutivo {
  [key: string]: unknown;
}

export interface RankingAgente {
  agent: string;
  score: number;
  total_calls: number;
  avg_duration: number;
}

export interface SLACumplimiento {
  queue?: string;
  sla_percentage: number;
  calls_within_sla: number;
  total_calls: number;
}

// ─── Usuarios (gestión interna) ───────────────────────────────────────────────

export interface AppUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  must_change_password?: boolean;
  access_dashboard: boolean;
  access_calls: boolean;
  access_queues: boolean;
  access_agents: boolean;
  access_reports: boolean;
}

// ⚠️ Al crear, el backend genera una contraseña temporal y la envía por correo
// (must_change_password = true). Por eso NO se envía password aquí.
export interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  is_admin?: boolean;
  access_dashboard?: boolean;
  access_calls?: boolean;
  access_queues?: boolean;
  access_agents?: boolean;
  access_reports?: boolean;
}

export interface UserUpdate {
  email?: string | null;
  password?: string | null;
  full_name?: string | null;
  is_active?: boolean | null;
  is_admin?: boolean | null;
  access_dashboard?: boolean | null;
  access_calls?: boolean | null;
  access_queues?: boolean | null;
  access_agents?: boolean | null;
  access_reports?: boolean | null;
}

// Respuesta de creación / reset: el backend puede devolver la temporal de
// fallback si el correo no se pudo enviar.
export interface UserPasswordActionResponse {
  success?: boolean;
  message?: string;
  id?: number;
  email_sent?: boolean;
  temp_password?: string;
}

// ─── API genérica ─────────────────────────────────────────────────────────────

export interface ApiError {
  message?: string;
  detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
  status: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  queue?: string;
  agent?: string;
}
