// lib/db.ts — Capa de abstracción de base de datos
// Usa mock en memoria ahora. Para migrar a Supabase:
// 1. Rellenar .env.local con credenciales de Supabase
// 2. Cambiar los imports aquí para usar lib/supabase/server.ts
// 3. Todo lo demás sigue igual

export {
  insertUser,
  getUsers,
  getUserById,
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
  // Sessions
  getAllSessions,
  getSessionsSummary,
  getSessionsByTecnica,
  getSessionsByDay,
  getSessionsByHour,
  getEngagementDistribution,
  // Correlations
  getTecnicaByGenero,
  getTecnicaByEdad,
  getTecnicaByMedicacion,
  getCompletionByMedicacion,
  getDuracionByEdad,
  getHorasSuenoByTecnica,
  getMedicacionByHorasSueno,
  // Geographic
  getUsersByCountry,
  getUsersByCiudad,
  getSessionsByCountry,
  getGeoTable,
  // Blog
  insertBlogPost,
  getBlogPosts,
  getPublishedBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  updateBlogPost,
  deleteBlogPost,
  // Retreats
  insertRetreat,
  getRetreats,
  getPublishedRetreats,
  getRetreatById,
  updateRetreat,
  deleteRetreat,
} from './mock/db'
