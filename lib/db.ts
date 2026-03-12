// lib/db.ts — Capa de abstracción de base de datos
// Usa mock en memoria ahora. Para migrar a Supabase:
// 1. Rellenar .env.local con credenciales de Supabase
// 2. Cambiar los imports aquí para usar lib/supabase/server.ts
// 3. Todo lo demás sigue igual

export {
  insertUser,
  getUsers,
  updateUser,
  insertSession,
  getSessionsByUser,
  getMostUsedPattern,
  getDashboardSummary,
  getByGenero,
  getByEdad,
  getByMedicacion,
  getByTecnica,
  getByHoras,
} from './mock/db'
