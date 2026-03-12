// lib/db.ts — Capa de abstracción de base de datos
// Usa Supabase en producción. Para desarrollo local sin Supabase,
// cambiar el import a './mock/db'

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
} from './supabase/db'
