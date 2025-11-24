// actions/form-responses.actions.ts

import { serverDelete, serverGet, serverPost } from "@/app/common/util/fetch";


export interface Client {
  id: number;
  raisonSociale: string;
  siret: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  user: {
    email: string;
    nom: string;
  };
}

export interface DynamicForm {
  id: number;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormField {
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validation?: any;
  options?: string[];
}

export interface EmailLog {
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  respondedAt?: string;
}

export interface FormResponse {
  id: number;
  responses: Record<string, any>;
  status: string;
  dateCreation: string;
  dateCompletion?: string;
  dateExpiration: string;
  ipAddress?: string;
  userAgent?: string;
  isRead: boolean;
  dateRead?: string;
  client: Client;
  dynamicForm: DynamicForm;
  emailLog?: EmailLog;
}

export interface Stats {
  totalResponses: number;
  unreadCount: number;
  readCount: number;
  completedToday: number;
  responsesByForm: any[];
  recentUnread: any[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  unreadCount: number;
}

export interface GetResponsesParams {
  page?: number;
  limit?: number;
  formId?: number;
  clientId?: number;
  isRead?: boolean;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetResponsesResult {
  responses: FormResponse[];
  pagination: Pagination;
}

/**
 * Get all form responses with filters and pagination
 */
export const getFormResponses = async (params?: GetResponsesParams): Promise<GetResponsesResult> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.formId) queryParams.append('formId', params.formId.toString());
  if (params?.clientId) queryParams.append('clientId', params.clientId.toString());
  if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const queryString = queryParams.toString();
  const url = queryString ? `form-responses?${queryString}` : '/form-responses';
  
  return serverGet(url);
};

/**
 * Get form response statistics
 */
export const getFormResponseStats = async (): Promise<Stats> => {
  return serverGet('form-responses/stats');
};

/**
 * Get a single form response by ID
 */
export const getFormResponseById = async (responseId: number): Promise<FormResponse> => {
  return serverGet(`form-responses/${responseId}`);
};

/**
 * Mark a response as read
 */
export const markResponseAsRead = async (responseId: number): Promise<FormResponse> => {
  return serverPost(`form-responses/${responseId}/mark-read`, {});
};

/**
 * Mark a response as unread
 */
export const markResponseAsUnread = async (responseId: number): Promise<FormResponse> => {
  return serverPost(`form-responses/${responseId}/mark-unread`, {});
};

/**
 * Mark multiple responses as read
 */
export const markMultipleResponsesAsRead = async (responseIds: number[]): Promise<{ updated: number }> => {
  return serverPost('form-responses/mark-read/bulk', { responseIds });
};

/**
 * Delete a form response
 */
export const deleteFormResponse = async (responseId: number): Promise<{ success: boolean; message: string }> => {
  return serverDelete(`form-responses/${responseId}`);
};

/**
 * Toggle read status of a response
 */
export const toggleResponseReadStatus = async (
  responseId: number, 
  currentStatus: boolean
): Promise<FormResponse> => {
  if (currentStatus) {
    return markResponseAsUnread(responseId);
  } else {
    return markResponseAsRead(responseId);
  }
};