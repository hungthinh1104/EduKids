import { apiClient } from '@/shared/services/api.client';
import { useAuthStore } from '@/shared/store/auth.store';

// ==================== PARENT REPORTS API ====================
// Automated report generation and subscriptions

export interface ReportConfig {
  childId: number;
  period: 'daily' | 'weekly' | 'monthly';
  format: 'email' | 'zalo' | 'both';
  includeCharts: boolean;
  language: 'vi' | 'en';
}

export interface GeneratedReport {
  reportId: number;
  parentId: number;
  weekEndingDate: string;
  children: Array<{
    childId: number;
    childName: string;
    childAge: number;
    avatar: string;
    minutesLearned: number;
    sessionsCompleted: number;
    pronunciationAccuracy: number;
    quizzesCompleted: number;
    averageQuizScore: number;
    wordsLearned: number;
    vocabularyRetention: number;
    totalPoints: number;
    currentLevel: number;
    newBadges: number;
    aiInsight: string;
  }>;
  summaryMessage: string;
  recommendations: string;
  generatedAt: string;
  sentAt?: string;
  deliveryChannel?: 'EMAIL' | 'ZALO' | 'IN_APP';
}

export interface ReportSubscription {
  id: number;
  childId: number;
  schedule: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm
  deliveryMethod: 'email' | 'zalo' | 'both';
  isActive: boolean;
  createdAt: string;
}

export interface ReportPreferences {
  email: string;
  zaloPhone?: string;
  emailEnabled?: boolean;
  zaloEnabled?: boolean;
  isSubscribed?: boolean;
  preferredChannel?: 'EMAIL' | 'ZALO' | 'IN_APP';
  frequency?: 'daily' | 'weekly' | 'monthly';
  reportDay?: number;
  reportHour?: number;
  language: 'vi' | 'en';
  includeCharts: boolean;
  subscriptions: ReportSubscription[];
}

export interface ReportNotification {
  notificationId: string;
  parentId: number;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

type ApiEnvelope<T> = { data?: T };
type ApiResponseLike<T> = { data?: T | ApiEnvelope<T> };
type Dict = Record<string, unknown>;

interface BackendReportPreference {
  email?: string;
  zaloPhoneNumber?: string;
  isSubscribed?: boolean;
  preferredChannel?: string;
  frequency?: string;
  reportDay?: number;
  reportHour?: number;
  createdAt?: string;
}

interface BackendSubscriptionResult {
  success?: boolean;
  message?: string;
  preference?: BackendReportPreference;
}

interface BackendUnsubscriptionResult {
  success?: boolean;
  message?: string;
}

const isRecord = (value: unknown): value is Dict => {
  return typeof value === 'object' && value !== null;
};

const unwrapData = <T>(response: ApiResponseLike<T>): T => {
  const responseData = response.data;
  if (isRecord(responseData) && 'data' in responseData) {
    const nested = (responseData as ApiEnvelope<T>).data;
    return (nested ?? (responseData as unknown as T)) as T;
  }
  return responseData as T;
};

const toBackendRange = (period: 'daily' | 'weekly' | 'monthly'): 'WEEK' | 'MONTH' => {
  return period === 'monthly' ? 'MONTH' : 'WEEK';
};

const normalizePreferences = (raw: unknown): ReportPreferences => {
  const value = isRecord(raw) ? raw : {};
  const preferredChannel = String(value.preferredChannel ?? '').toUpperCase();
  const frequencyRaw = String(value.frequency ?? 'WEEKLY').toLowerCase();
  const frequency: 'daily' | 'weekly' | 'monthly' =
    frequencyRaw.includes('day')
      ? 'daily'
      : frequencyRaw.includes('month')
        ? 'monthly'
        : 'weekly';

  return {
    email: typeof value.email === 'string' ? value.email : '',
    zaloPhone: typeof value.zaloPhoneNumber === 'string' ? value.zaloPhoneNumber : undefined,
    isSubscribed: Boolean(value.isSubscribed),
    preferredChannel:
      preferredChannel === 'ZALO' || preferredChannel === 'IN_APP' || preferredChannel === 'EMAIL'
        ? (preferredChannel as 'EMAIL' | 'ZALO' | 'IN_APP')
        : undefined,
    emailEnabled: Boolean(value.isSubscribed) && preferredChannel === 'EMAIL',
    zaloEnabled: Boolean(value.isSubscribed) && preferredChannel === 'ZALO',
    frequency,
    reportDay: typeof value.reportDay === 'number' ? value.reportDay : undefined,
    reportHour: typeof value.reportHour === 'number' ? value.reportHour : undefined,
    language: 'vi',
    includeCharts: true,
    subscriptions: [],
  };
};

const extractBackendPreference = (raw: unknown): BackendReportPreference => {
  if (!isRecord(raw)) return {};
  if ('preference' in raw) {
    const nested = (raw as { preference?: unknown }).preference;
    return isRecord(nested) ? (nested as BackendReportPreference) : {};
  }
  return raw as BackendReportPreference;
};

/**
 * Generate report for child
 * POST /api/reports/generate
 * @Roles PARENT
 * @body { childId: number, period: string }
 */
export const generateReport = async (
  childId: number,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<GeneratedReport> => {
  const range = toBackendRange(period);
  const response = await apiClient.post('/reports/generate', {
    childId,
    range,
  });
  return unwrapData<GeneratedReport>(response);
};

/**
 * Send report immediately
 * POST /api/reports/send
 * @Roles PARENT
 * @body { childId: number, period: string, method: 'email' | 'zalo' | 'both' }
 */
export const sendReport = async (
  childId: number,
  period: 'daily' | 'weekly' | 'monthly',
  method: 'email' | 'zalo' | 'both' = 'email'
): Promise<{ success: boolean; message: string; reportId: number; report: GeneratedReport }> => {
  void method;
  const range = toBackendRange(period);
  const response = await apiClient.post('/reports/send', {
    childId,
    range,
    schedule: period,
  });
  return unwrapData<{ success: boolean; message: string; reportId: number; report: GeneratedReport }>(response);
};

/**
 * Subscribe to automated reports
 * POST /api/reports/subscribe
 * @Roles PARENT
 * @body ReportSubscription data
 */
export const subscribeToReports = async (
  subscriptionOrChildId: Omit<ReportSubscription, 'id' | 'createdAt' | 'isActive'> | number,
  method?: 'email' | 'zalo' | 'both',
  schedule?: 'daily' | 'weekly' | 'monthly'
): Promise<ReportSubscription> => {
  const currentEmail = useAuthStore.getState().user?.email;
  const requestedMethod = method ?? 'email';
  const channel = requestedMethod.toUpperCase();
  const effectiveDeliveryMethod: 'email' | 'zalo' | 'both' =
    typeof subscriptionOrChildId === 'number'
      ? requestedMethod
      : subscriptionOrChildId.deliveryMethod;
  const backendPayload =
    typeof subscriptionOrChildId === 'number'
      ? {
          preferredChannel: channel === 'ZALO' ? 'ZALO' : 'EMAIL',
          email: channel === 'ZALO' ? undefined : currentEmail,
          reportDay: schedule === 'monthly' ? 1 : 1,
          reportHour: 9,
        }
      : {
          preferredChannel: subscriptionOrChildId.deliveryMethod === 'zalo' ? 'ZALO' : 'EMAIL',
          email: currentEmail,
          reportDay: 1,
          reportHour: 9,
        };

  const response = await apiClient.post('/reports/subscribe', backendPayload);
  const raw = unwrapData<BackendSubscriptionResult | BackendReportPreference | { preference?: BackendReportPreference }>(response);
  const pref = extractBackendPreference(raw);
  const reportHour = typeof pref?.reportHour === 'number' ? pref.reportHour : 9;

  return {
    id: 1,
    childId: typeof subscriptionOrChildId === 'number' ? subscriptionOrChildId : subscriptionOrChildId.childId,
    schedule: schedule ?? 'weekly',
    time: `${String(reportHour).padStart(2, '0')}:00`,
    deliveryMethod: effectiveDeliveryMethod,
    isActive: Boolean(pref?.isSubscribed),
    createdAt: pref?.createdAt ?? new Date().toISOString(),
  };
};

/**
 * Unsubscribe from automated reports
 * POST /api/reports/unsubscribe
 * @Roles PARENT
 * @body { subscriptionId: number }
 */
export const unsubscribeFromReports = async (): Promise<{ message: string }> => {
  const response = await apiClient.post('/reports/unsubscribe', {});
  const data = unwrapData<BackendUnsubscriptionResult>(response);
  return { message: data?.message ?? 'Unsubscribed successfully' };
};

/**
 * Get report preferences and subscriptions
 * GET /api/reports/preferences
 * @Roles PARENT
 */
export const getReportPreferences = async (childId?: number): Promise<ReportPreferences> => {
  void childId;
  const response = await apiClient.get('/reports/preferences');
  return normalizePreferences(unwrapData<unknown>(response));
};

/**
 * Update report preferences
 * PUT /api/reports/preferences
 * @Roles PARENT
 * @body Partial<ReportPreferences>
 */
export const updateReportPreferences = async (
  preferencesOrChildId: Partial<ReportPreferences> | number,
  maybePreferences?: Partial<ReportPreferences>
): Promise<ReportPreferences> => {
  const payload =
    typeof preferencesOrChildId === 'number'
      ? (maybePreferences ?? {})
      : preferencesOrChildId;

  const uiPrefs = payload as Partial<ReportPreferences>;
  const response = await apiClient.put('/reports/preferences', {
    isSubscribed:
      uiPrefs.emailEnabled === true || uiPrefs.zaloEnabled === true
        ? true
        : uiPrefs.emailEnabled === false && uiPrefs.zaloEnabled === false
          ? false
          : undefined,
    preferredChannel:
      uiPrefs.zaloEnabled === true
        ? 'ZALO'
        : uiPrefs.emailEnabled === true
          ? 'EMAIL'
          : undefined,
    email: uiPrefs.email,
    zaloPhoneNumber: uiPrefs.zaloPhone,
    reportDay: uiPrefs.reportDay,
    reportHour: uiPrefs.reportHour,
  });

  return normalizePreferences(unwrapData<unknown>(response));
};

export const getReportNotifications = async (): Promise<ReportNotification[]> => {
  const response = await apiClient.get('/reports/notifications');
  return unwrapData<ReportNotification[]>(response);
};

export const markReportNotificationAsRead = async (
  notificationId: string
): Promise<ReportNotification> => {
  const response = await apiClient.patch(`/reports/notifications/${notificationId}/read`);
  return unwrapData<ReportNotification>(response);
};
