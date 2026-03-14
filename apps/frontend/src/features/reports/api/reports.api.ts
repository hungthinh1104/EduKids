import { apiClient } from '@/shared/services/api.client';
import { useAuthStore } from '@/shared/store/auth.store';

// ==================== PARENT REPORTS API ====================
// Automated report generation and subscriptions

export interface ReportConfig {
  childId: number;
  period: 'daily' | 'weekly' | 'monthly';
  format: 'email' | 'zalo' | 'both';
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

export interface ReportPreferences {
  email: string;
  zaloPhone?: string;
  emailEnabled?: boolean;
  zaloEnabled?: boolean;
  isSubscribed?: boolean;
  preferredChannel?: 'EMAIL' | 'ZALO' | 'IN_APP';
  frequency?: 'weekly';
  reportDay?: number;
  reportHour?: number;
  createdAt?: string;
  updatedAt?: string;
  lastReportSentAt?: string;
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
    frequency: 'weekly',
    reportDay: typeof value.reportDay === 'number' ? value.reportDay : undefined,
    reportHour: typeof value.reportHour === 'number' ? value.reportHour : undefined,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
    lastReportSentAt:
      typeof value.lastReportSentAt === 'string' ? value.lastReportSentAt : undefined,
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
  preferredChannel: 'email' | 'zalo' = 'email'
): Promise<ReportPreferences> => {
  const currentEmail = useAuthStore.getState().user?.email;
  const backendPayload = {
    preferredChannel: preferredChannel === 'zalo' ? 'ZALO' : 'EMAIL',
    email: preferredChannel === 'email' ? currentEmail : undefined,
    reportDay: 1,
    reportHour: 9,
  };

  const response = await apiClient.post('/reports/subscribe', backendPayload);
  const raw = unwrapData<BackendSubscriptionResult | BackendReportPreference | { preference?: BackendReportPreference }>(response);
  return normalizePreferences(extractBackendPreference(raw));
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
