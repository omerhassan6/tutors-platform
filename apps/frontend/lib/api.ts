import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { supabase } from './supabaseClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  code: string
  message: string
  status: number
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor — attach auth token ─────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch {
      // no-op — unauthenticated request
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor — unwrap data / map errors ─────────────────────────

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input.',
  401: 'You are not authorised. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The resource may already exist.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please slow down.',
  500: 'A server error occurred. Please try again later.',
  502: 'Bad gateway. The server is temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
}

api.interceptors.response.use(
  (response) => {
    // If the response wraps data in { data, success, message }, unwrap it
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'success' in response.data
    ) {
      response.data = (response.data as ApiResponse<unknown>).data
    }
    return response
  },
  (error: AxiosError) => {
    const status = error.response?.status ?? 0
    const serverMessage =
      (error.response?.data as Record<string, unknown>)?.message as string | undefined

    const enriched: ApiError = {
      status,
      code: error.code || 'UNKNOWN_ERROR',
      message:
        serverMessage ||
        STATUS_MESSAGES[status] ||
        error.message ||
        'An unexpected error occurred.',
    }

    return Promise.reject(enriched)
  }
)

// ─── Typed helpers ────────────────────────────────────────────────────────────

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<T>(url, { params })
  return res.data
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<T>(url, body)
  return res.data
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.patch<T>(url, body)
  return res.data
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<T>(url)
  return res.data
}

export default api
