import { env } from '$env/dynamic/private';
import { error, redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';

const accessCookie = 'aspa_admin_access';
const refreshCookie = 'aspa_admin_refresh';

export type AdminUser = {
	id: string;
	phone_number: string | null;
	username: string | null;
	email: string | null;
	account_level: 'free' | 'pro';
	is_active: boolean;
	is_admin: boolean;
	created_at: string;
};

export type Page<T> = { items: T[]; page: number; page_size: number; total: number; pages: number };

export type Reference = { id: string; name_fa: string; is_active?: boolean };
export type Exercise = {
	id: string;
	name_fa: string;
	description_fa: string | null;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	is_active: boolean;
	equipment: Reference | null;
	primary_muscles: Reference[];
	secondary_muscles: Reference[];
	instruction_steps: { text_fa: string }[];
	media: { media_type: 'gif' | 'mp4'; object_key: string }[];
};

function cookieOptions(event: RequestEvent, maxAge: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: event.url.protocol === 'https:',
		sameSite: 'strict' as const,
		maxAge
	};
}

export function setSession(
	event: RequestEvent,
	value: {
		access_token: string;
		refresh_token: string;
		refresh_expires_in: number;
	}
) {
	event.cookies.set(accessCookie, value.access_token, cookieOptions(event, 7 * 24 * 60 * 60));
	event.cookies.set(
		refreshCookie,
		value.refresh_token,
		cookieOptions(event, value.refresh_expires_in)
	);
}

export function clearSession(cookies: Cookies) {
	cookies.delete(accessCookie, { path: '/' });
	cookies.delete(refreshCookie, { path: '/' });
}

export async function requestApi(path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(`${env.API_BASE_URL || 'http://localhost:8000'}${path}`, {
		...init,
		headers: { Accept: 'application/json', ...init.headers },
		cache: 'no-store'
	});
}

export async function authenticate(event: RequestEvent): Promise<boolean> {
	let token = event.cookies.get(accessCookie);
	let response = token
		? await requestApi('/api/admin/me', { headers: { Authorization: `Bearer ${token}` } })
		: null;
	if (!response?.ok) {
		const refresh = event.cookies.get(refreshCookie);
		if (!refresh) {
			clearSession(event.cookies);
			return false;
		}
		const rotated = await requestApi('/api/auth/refresh', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refresh })
		});
		if (!rotated.ok) {
			clearSession(event.cookies);
			return false;
		}
		const session = await rotated.json();
		if (!session.user?.is_admin) {
			clearSession(event.cookies);
			return false;
		}
		setSession(event, session);
		token = session.access_token;
		response = await requestApi('/api/admin/me', {
			headers: { Authorization: `Bearer ${token}` }
		});
	}
	if (!response?.ok || !token) {
		clearSession(event.cookies);
		return false;
	}
	event.locals.admin = await response.json();
	event.locals.accessToken = token;
	return true;
}

export async function adminApi(event: RequestEvent, path: string, init: RequestInit = {}) {
	if (!event.locals.accessToken) redirect(303, '/login');
	const response = await requestApi(path, {
		...init,
		headers: { Authorization: `Bearer ${event.locals.accessToken}`, ...init.headers }
	});
	if (response.status === 401 || response.status === 403) {
		clearSession(event.cookies);
		redirect(303, '/login');
	}
	return response;
}

export async function readApi<T>(event: RequestEvent, path: string): Promise<T> {
	const response = await adminApi(event, path);
	if (!response.ok) error(response.status, 'دریافت اطلاعات ناموفق بود');
	return response.json() as Promise<T>;
}
