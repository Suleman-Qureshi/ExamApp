// src/lib/api/auth.ts
import type { Role } from '../../types/index.d.ts';

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || '/api';

async function jsonFetch<T>(path: string, init: RequestInit) {
  const res = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data)?.message || 'Request failed');
  return data as T;
}

export async function login(params: { email: string; password: string; role: Role }) {
  // returns { token, role }
  return jsonFetch<{ token: string; role: Role }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function register(userData: {
  email: string;
  password: string;
  userType: Role;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  institution?: string;
  fieldOfStudy?: string;
}) {
  // caller can format date if needed; or keep your ISO transform in the page
  return jsonFetch<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// Optional helpers if you want to call in components
export function saveToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('token', token);
}

export function logout() {
  if (typeof window !== 'undefined') localStorage.removeItem('token');
}