/**
 * Tipos TypeScript para PowerOS Corporate Edition
 * Documentação de interfaces e estruturas de dados
 */

// ==================== CORE TYPES ====================

/**
 * Entidade Tarefa principal
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  category: 'Pessoal' | 'Trabalho' | 'Estudo' | 'Saúde';
  status: 'pendente' | 'concluída' | 'em_progresso';
  due_date?: string;
  created_at: string;
  updated_at?: string;
  tempoEstimado?: number; // em minutos
  tempoReal?: number; // em minutos
  tags?: string[];
  assignedTo?: string;
  subtasks?: SubTask[];
  attachments?: Attachment[];
  optimistic?: boolean; // Para optimistic UI
}

/**
 * Subtarefas
 */
export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  created_at: string;
}

/**
 * Anexos de tarefas
 */
export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

// ==================== USER & AUTH ====================

/**
 * Perfil do usuário
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  gamification: GamificationData;
  subscription: SubscriptionInfo;
  createdAt: string;
  lastLogin: string;
}

/**
 * Preferências do usuário
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
  productivity: ProductivitySettings;
}

/**
 * Configurações de notificação
 */
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  taskReminders: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

/**
 * Configurações do dashboard
 */
export interface DashboardSettings {
  layout: 'grid' | 'list' | 'kanban';
  widgets: WidgetConfig[];
  defaultView: string;
  compactMode: boolean;
}

/**
 * Configuração de widget
 */
export interface WidgetConfig {
  id: string;
  type: 'stats' | 'calendar' | 'tasks' | 'analytics';
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
}

/**
 * Configurações de produtividade
 */
export interface ProductivitySettings {
  workingHours: {
    start: string;
    end: string;
  };
  breakReminders: boolean;
  focusTime: number; // em minutos
  energyTracking: boolean;
  moodTracking: boolean;
}

// ==================== GAMIFICATION ====================

/**
 * Dados de gamificação
 */
export interface GamificationData {
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
}

/**
 * Badge/Conquista
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
}

/**
 * Conquista específica
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  completedAt?: string;
  rewards: Reward[];
}

/**
 * Recompensa
 */
export interface Reward {
  type: 'xp' | 'badge' | 'title' | 'avatar';
  value: string | number;
}

/**
 * Entry no leaderboard
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  rank: number;
  change: number; // mudança no ranking
}

// ==================== SMART ASSISTANT ====================

/**
 * Estado de humor do usuário
 */
export interface MoodState {
  mood: 'energizado' | 'motivado' | 'neutro' | 'cansado' | 'estressado';
  timestamp: Date;
  suggestions: string[];
  energyLevel: number; // 1-10
  focusLevel: number; // 1-10
  stressLevel: number; // 1-10
}

/**
 * Dados de predição
 */
export interface PredictionData {
  estimatedCompletionTime: Date;
  recommendedTasksToMove: TaskRecommendation[];
  workloadLevel: 'leve' | 'moderado' | 'intenso' | 'sobrecarregado';
  dailyProgress: number;
  efficiency: number; // 0-100
  insights: PredictionInsight[];
}

/**
 * Recomendação de tarefa
 */
export interface TaskRecommendation {
  task: Task;
  reason: string;
  priority: number;
  confidence: number; // 0-100
  alternativeActions: string[];
}

/**
 * Insight de predição
 */
export interface PredictionInsight {
  type: 'warning' | 'info' | 'tip' | 'suggestion';
  title: string;
  message: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Tema adaptativo
 */
export interface AdaptiveTheme {
  colorScheme: 'default' | 'warm' | 'cool' | 'energetic' | 'calm';
  backgroundIntensity: number;
  animationSpeed: number;
  cognitiveLoadFilter: boolean;
  accentColor: string;
}

// ==================== OPTIMISTIC UI ====================

/**
 * Operação otimista
 */
export interface OptimisticOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE' | 'CLEAR_COMPLETED';
  status: 'pending' | 'success' | 'error' | 'rolled_back';
  data: any;
  timestamp: number;
  completedAt?: number;
  error?: string;
  rollbackError?: string;
  failedAt?: number;
  rolledBackAt?: number;
}

/**
 * Notificação Toast
 */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: ToastAction;
  timestamp: number;
}

/**
 * Ação do toast
 */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

// ==================== COMMAND PALETTE ====================

/**
 * Comando do Command Palette
 */
export interface Command {
  id: string;
  type: 'navigate' | 'create_task' | 'filter' | 'action' | 'search';
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  requiresInput?: boolean;
  action: (input?: string) => any;
  destructive?: boolean;
  category?: string;
}

/**
 * Histórico de comandos
 */
export interface CommandHistoryEntry {
  query: string;
  command: string;
  timestamp: number;
  success: boolean;
}

// ==================== PERFORMANCE LOGGING ====================

/**
 * Entrada de log
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  category: 'performance' | 'api' | 'ui' | 'user_action' | 'error' | 'system';
  message: string;
  data: any;
  context: LogContext;
  memory?: MemoryUsage;
  performance?: PerformanceMetrics;
}

/**
 * Contexto do log
 */
export interface LogContext {
  url: string;
  userAgent: string;
  userId?: string;
  component?: string;
  action?: string;
}

/**
 * Uso de memória
 */
export interface MemoryUsage {
  used: number; // MB
  total: number; // MB
  limit: number; // MB
}

/**
 * Métricas de performance
 */
export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  domInteractive: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
}

/**
 * Estatísticas da sessão
 */
export interface SessionStats {
  sessionId: string;
  duration: number; // segundos
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByCategory: Record<string, number>;
  errors: number;
  avgMemory: number;
  apiCalls: number;
  renderCount: number;
}

// ==================== API RESPONSES ====================

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
}

/**
 * Erro da API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==================== ANALYTICS ====================

/**
 * Dados analíticos
 */
export interface AnalyticsData {
  productivity: ProductivityAnalytics;
  timeTracking: TimeTrackingAnalytics;
  behavior: BehaviorAnalytics;
  performance: PerformanceAnalytics;
}

/**
 * Analíticos de produtividade
 */
export interface ProductivityAnalytics {
  tasksCompleted: number;
  completionRate: number;
  avgCompletionTime: number;
  productivityScore: number;
  trends: ProductivityTrend[];
}

/**
 * Tendência de produtividade
 */
export interface ProductivityTrend {
  date: string;
  score: number;
  tasksCompleted: number;
  focusTime: number;
}

/**
 * Analíticos de tempo
 */
export interface TimeTrackingAnalytics {
  totalTime: number;
  focusedTime: number;
  breakTime: number;
  efficiency: number;
  patterns: TimePattern[];
}

/**
 * Padrão de tempo
 */
export interface TimePattern {
  hour: number;
  productivity: number;
  taskCount: number;
}

/**
 * Analíticos de comportamento
 */
export interface BehaviorAnalytics {
  moodPatterns: MoodPattern[];
  energyPatterns: EnergyPattern[];
  procrastinationScore: number;
  optimalWorkTimes: number[];
}

/**
 * Padrão de humor
 */
export interface MoodPattern {
  mood: MoodState['mood'];
  frequency: number;
  avgProductivity: number;
  commonTasks: string[];
}

/**
 * Padrão de energia
 */
export interface EnergyPattern {
  level: number;
  timeOfDay: string;
  taskTypes: string[];
  successRate: number;
}

/**
 * Analíticos de performance
 */
export interface PerformanceAnalytics {
  renderTimes: RenderMetric[];
  apiResponseTimes: ApiMetric[];
  memoryUsage: MemoryMetric[];
  errorRates: ErrorMetric[];
}

/**
 * Métrica de render
 */
export interface RenderMetric {
  component: string;
  avgTime: number;
  maxTime: number;
  minTime: number;
  sampleCount: number;
}

/**
 * Métrica de API
 */
export interface ApiMetric {
  endpoint: string;
  avgTime: number;
  successRate: number;
  errorCount: number;
  requestCount: number;
}

/**
 * Métrica de memória
 */
export interface MemoryMetric {
  timestamp: number;
  used: number;
  total: number;
  pressure: number;
}

/**
 * Métrica de erro
 */
export interface ErrorMetric {
  type: string;
  count: number;
  lastOccurrence: number;
  context: any;
}

// ==================== SUBSCRIPTION ====================

/**
 * Informações de assinatura
 */
export interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  features: string[];
  limits: SubscriptionLimits;
}

/**
 * Limites da assinatura
 */
export interface SubscriptionLimits {
  maxTasks: number;
  maxProjects: number;
  maxStorage: number; // MB
  maxApiCalls: number; // por dia
  features: string[];
}

// ==================== UTILITIES ====================

/**
 * Opções de filtro
 */
export interface FilterOptions {
  busca?: string;
  filtroStatus?: 'todas' | 'pendentes' | 'concluidas';
  filtroPrazo?: 'todos' | 'hoje' | 'atrasadas' | 'em_breve';
  ordenacao?: 'recentes' | 'antigas' | 'prioridade';
  categorias?: string[];
  prioridades?: string[];
  assignedTo?: string[];
}

/**
 * Opções de paginação
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado de busca
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions: string[];
  took: number; // ms
}

/**
 * Opções de exportação
 */
export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  dateRange: {
    start: string;
    end: string;
  };
  includeCompleted: boolean;
  includeAnalytics: boolean;
}

/**
 * Configurações de notificação
 */
export interface NotificationConfig {
  type: 'email' | 'push' | 'in_app';
  title: string;
  body: string;
  data?: any;
  actions?: NotificationAction[];
}

/**
 * Ação de notificação
 */
export interface NotificationAction {
  id: string;
  title: string;
  callback: () => void;
}

// ==================== ERROR TYPES ====================

/**
 * Erro customizado do PowerOS
 */
export class PowerOSError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: 'validation' | 'api' | 'auth' | 'system' | 'network',
    public details?: any
  ) {
    super(message);
    this.name = 'PowerOSError';
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends PowerOSError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 'validation', { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Erro de API
 */
export class ApiError extends PowerOSError {
  constructor(message: string, status: number, response?: any) {
    super(message, `API_ERROR_${status}`, 'api', { status, response });
    this.name = 'ApiError';
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends PowerOSError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 'auth');
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro de rede
 */
export class NetworkError extends PowerOSError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 'network');
    this.name = 'NetworkError';
  }
}
