import { SERVICES, ServiceConfig } from './config.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('http-client');

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  timeoutMs?: number;
}

export class ServiceClient {
  constructor(private targetService: ServiceConfig) {}

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.targetService.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const method = options.method || 'GET';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    try {
      logger.debug(`[Service Call] ${method} -> ${url}`);
      const res = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Service ${this.targetService.name} returned HTTP ${res.status}`);
      }
      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      logger.error(`[Service Call Failed] ${method} ${url}: ${err.message}`);
      throw err;
    }
  }

  get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const clients = {
  auth: new ServiceClient(SERVICES.auth),
  users: new ServiceClient(SERVICES.users),
  admin: new ServiceClient(SERVICES.admin),
  skills: new ServiceClient(SERVICES.skills),
  location: new ServiceClient(SERVICES.location),
  requests: new ServiceClient(SERVICES.requests),
  bookings: new ServiceClient(SERVICES.bookings),
  wallet: new ServiceClient(SERVICES.wallet),
  messaging: new ServiceClient(SERVICES.messaging),
  email: new ServiceClient(SERVICES.email),
  subscriptions: new ServiceClient(SERVICES.subscriptions),
  payments: new ServiceClient(SERVICES.payments),
  ai: new ServiceClient(SERVICES.ai),
  reviews: new ServiceClient(SERVICES.reviews),
  analytics: new ServiceClient(SERVICES.analytics),
};
