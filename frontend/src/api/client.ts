const BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || '';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...customConfig } = options;

    let url = endpoint.startsWith('http')
      ? endpoint
      : `${BASE_URL}/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const defaultHeaders: Record<string, string> = {};
    if (!(customConfig.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
    });

    if (response.status === 401) {
      // Don't auto-clear in dev mode unless necessary
      // this.setToken(null);
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errData = await response.json();
        errorMessage = errData.detail || errData.message || errorMessage;
      } catch {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // For file downloads
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return (await response.text()) as unknown as T;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  // Auth methods
  async studentLogin(login: string, password: string, telegramInitData?: string) {
    const res = await this.request<{ access_token: string; user: any }>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({
        login,
        password,
        telegram_init_data: telegramInitData,
      }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async checkTelegram(initData: string) {
    return this.request<{
      is_linked: boolean;
      telegram_id?: number;
      access_token?: string;
      user?: any;
      message?: string;
    }>('/auth/telegram-check', {
      method: 'POST',
      body: JSON.stringify({ init_data: initData }),
    });
  }

  async logout(initData?: string) {
    try {
      if (initData) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ init_data: initData }),
        });
      }
    } catch {
      // Ignore network errors on logout
    }
    this.setToken(null);
  }

  async telegramAuth(initData: string) {
    const res = await this.request<{ access_token: string; user: any }>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ init_data: initData }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async devLogin(role: 'STUDENT' | 'TEACHER' | 'ADMIN', firstName: string, username?: string, telegramId?: number) {
    const res = await this.request<{ access_token: string; user: any }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({
        role,
        first_name: firstName,
        username,
        telegram_id: telegramId,
      }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Media
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{
      file_url: string;
      filename: string;
      file_size: number;
      duration?: number;
      category: string;
    }>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Student API
  async getStudentHome() {
    return this.request<any>('/student/home');
  }

  async getStudentAssignment(id: string) {
    return this.request<any>(`/student/assignments/${id}`);
  }

  async saveDraft(assignmentId: string, answers: any[]) {
    return this.request<any>(`/student/assignments/${assignmentId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async submitHomework(assignmentId: string, answers: any[]) {
    return this.request<any>(`/student/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getStudentResults() {
    return this.request<any[]>('/student/results');
  }

  async getStudentResultDetail(submissionId: string) {
    return this.request<any>(`/student/results/${submissionId}`);
  }

  async getStudentNotifications() {
    return this.request<any[]>('/student/notifications');
  }

  async markNotificationsRead(ids: string[] = []) {
    return this.request<any>('/student/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ notification_ids: ids }),
    });
  }

  // Student Lessons
  async getStudentLessons() {
    return this.request<any[]>('/student/lessons');
  }

  async getStudentLesson(id: string) {
    return this.request<any>(`/student/lessons/${id}`);
  }

  async updateStudentLessonProgress(id: string, payload: { status?: string; progress_percent?: number }) {
    return this.request<any>(`/student/lessons/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Teacher API
  async getTeacherDashboard() {
    return this.request<any>('/teacher/dashboard');
  }

  async getTeacherSubmissions(params?: Record<string, any>) {
    return this.request<any[]>('/teacher/submissions', { params });
  }

  async getSubmissionReview(id: string) {
    return this.request<any>(`/teacher/submissions/${id}`);
  }

  async gradeSubmission(id: string, payload: any) {
    return this.request<any>(`/teacher/submissions/${id}/grade`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAiAssist(submissionId: string, questionId?: string) {
    return this.request<any>(`/teacher/submissions/${submissionId}/ai-assist`, {
      method: 'POST',
      params: { question_id: questionId },
    });
  }

  async getTeacherAssignments(filters?: string | { status?: string; type?: string; group_id?: string; search?: string }) {
    const params = typeof filters === 'string' ? { status: filters } : filters;
    return this.request<any[]>('/teacher/assignments', {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getTeacherAssignment(id: string) {
    return this.request<any>(`/teacher/assignments/${id}`);
  }

  async createAssignment(payload: any) {
    return this.request<any>('/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAssignment(id: string, payload: any) {
    return this.request<any>(`/teacher/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async duplicateAssignment(id: string) {
    return this.request<any>(`/teacher/assignments/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async deleteAssignment(id: string) {
    return this.request<any>(`/teacher/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async getTeacherStudents(search?: string, groupId?: string) {
    return this.request<any[]>('/teacher/students', {
      params: { search, group_id: groupId },
    });
  }

  async getTeacherStudentProfile(id: string) {
    return this.request<any>(`/teacher/students/${id}`);
  }

  async getSuggestedCredentials(firstName?: string, lastName?: string) {
    return this.request<{ suggested_login: string; suggested_password: string }>(
      '/teacher/students/generate-credentials',
      { params: { first_name: firstName, last_name: lastName } }
    );
  }

  async createStudent(payload: {
    first_name: string;
    last_name?: string;
    login?: string;
    password?: string;
    group_id?: string;
    telegram_id?: number;
    phone?: string;
    status?: string;
    notes?: string;
  }) {
    return this.request<{
      status: string;
      message: string;
      student: any;
      plain_password?: string;
    }>('/teacher/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateStudent(id: string, payload: any) {
    return this.request<any>(`/teacher/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async resetStudentPassword(id: string, password?: string) {
    return this.request<{
      status: string;
      message: string;
      new_password: string;
    }>(`/teacher/students/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async updateStudentStatus(id: string, status: 'ACTIVE' | 'DISABLED') {
    return this.request<{
      status: string;
      message: string;
      student_status: string;
    }>(`/teacher/students/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getTeacherGroups() {
    return this.request<any[]>('/teacher/groups');
  }

  async createTeacherGroup(payload: any) {
    return this.request<any>('/teacher/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTeacherGroup(groupId: string, payload: any) {
    return this.request<any>(`/teacher/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTeacherGroup(groupId: string) {
    return this.request<any>(`/teacher/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  async getTeacherAnalytics() {
    return this.request<any>('/teacher/analytics');
  }

  async getAuditLogs() {
    return this.request<any[]>('/teacher/audit-logs');
  }

  // Teacher Lessons
  async getTeacherLessons() {
    return this.request<any[]>('/teacher/lessons');
  }

  async getTeacherLesson(id: string) {
    return this.request<any>(`/teacher/lessons/${id}`);
  }

  async createLesson(payload: any) {
    return this.request<any>('/teacher/lessons', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateLesson(id: string, payload: any) {
    return this.request<any>(`/teacher/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteLesson(id: string) {
    return this.request<any>(`/teacher/lessons/${id}`, {
      method: 'DELETE',
    });
  }

  async getLessonProgress(id: string) {
    return this.request<any[]>(`/teacher/lessons/${id}/progress`);
  }
}

export const api = new ApiClient();
