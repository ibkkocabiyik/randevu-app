const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  return localStorage.getItem('randevu-token');
}

export function setToken(token: string) {
  localStorage.setItem('randevu-token', token);
}

export function clearToken() {
  localStorage.removeItem('randevu-token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    request<{ token: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    }),
  login: (emailOrPhone: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ emailOrPhone, password }),
    }),
  adminLogin: (password: string) =>
    request<{ token: string }>('/api/auth/admin-login', {
      method: 'POST', body: JSON.stringify({ password }),
    }),
  me: () => request<ApiUser>('/api/auth/me'),
  updateMe: (patch: Partial<ApiUser>) =>
    request<ApiUser>('/api/auth/me', { method: 'PATCH', body: JSON.stringify(patch) }),
};

// ─── Services ────────────────────────────────────────────────
export const servicesApi = {
  list: () => request<ApiService[]>('/api/services'),
  create: (data: Omit<ApiService, 'id' | 'created_at'>) =>
    request<ApiService>('/api/services', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ApiService>) =>
    request<ApiService>(`/api/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/services/${id}`, { method: 'DELETE' }),
};

// ─── Employees ───────────────────────────────────────────────
export const employeesApi = {
  list: () => request<ApiEmployee[]>('/api/employees'),
  create: (data: { name: string; workingHours: { start: string; end: string }; serviceIds: string[] }) =>
    request<ApiEmployee>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; workingHours: { start: string; end: string }; serviceIds: string[] }>) =>
    request<{ ok: boolean }>(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/api/employees/${id}`, { method: 'DELETE' }),
};

// ─── Appointments ────────────────────────────────────────────
export const appointmentsApi = {
  list: () => request<ApiAppointment[]>('/api/appointments'),
  slots: (employeeId: string, date: string, duration: number) =>
    request<{ time: string; available: boolean }[]>(
      `/api/appointments/slots?employeeId=${employeeId}&date=${date}&duration=${duration}`
    ),
  create: (data: {
    customerName: string; customerPhone: string; serviceId: string;
    employeeId: string; date: string; startTime: string; endTime: string;
    notes?: string; customerId?: string;
  }) => request<ApiAppointment>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, patch: Partial<ApiAppointment>) =>
    request<ApiAppointment>(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  delete: (id: string) => request<void>(`/api/appointments/${id}`, { method: 'DELETE' }),
};

// ─── Reviews ─────────────────────────────────────────────────
export const reviewsApi = {
  list: (filter?: { serviceId?: string; employeeId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.serviceId)  params.set('serviceId', filter.serviceId);
    if (filter?.employeeId) params.set('employeeId', filter.employeeId);
    const qs = params.toString();
    return request<ApiReview[]>(`/api/reviews${qs ? '?' + qs : ''}`);
  },
  create: (data: {
    appointmentId: string; serviceId: string; employeeId: string;
    customerName: string; rating: number; comment: string;
  }) => request<ApiReview>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Customers (admin) ───────────────────────────────────────
export const customersApi = {
  list: () => request<ApiUser[]>('/api/customers'),
  notes: (phone?: string) => request<ApiCustomerNote[]>(`/api/customers/notes${phone ? '?phone=' + phone : ''}`),
  addNote: (customerPhone: string, text: string) =>
    request<ApiCustomerNote>('/api/customers/notes', { method: 'POST', body: JSON.stringify({ customerPhone, text }) }),
  deleteNote: (id: string) => request<void>(`/api/customers/notes/${id}`, { method: 'DELETE' }),
};

// ─── API Types ───────────────────────────────────────────────
export interface ApiService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  category: 'sac' | 'sakal' | 'bakim';
  created_at?: string;
}

export interface ApiEmployee {
  id: string;
  name: string;
  avatar?: string;
  working_hours_start: string;
  working_hours_end: string;
  serviceIds: string[];
  workingHours: { start: string; end: string };
  created_at?: string;
}

export interface ApiAppointment {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'noshow';
  notes?: string;
  created_at?: string;
}

export interface ApiReview {
  id: string;
  appointment_id: string;
  service_id: string;
  employee_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyalty_points: number;
  notif_booking_confirmed: boolean;
  notif_booking_cancelled: boolean;
  notif_booking_reminder: boolean;
  notif_review_request: boolean;
  created_at?: string;
}

export interface ApiCustomerNote {
  id: string;
  customer_phone: string;
  text: string;
  created_at: string;
}
