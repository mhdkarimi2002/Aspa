import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

vi.mock('$env/dynamic/private', () => ({ env: { API_BASE_URL: 'https://api.example.test' } }));
import { authenticate, setSession, clearSession } from './api';

function event(values: Record<string, string> = {}) {
	return {
		url: new URL('https://admin.example.test/users'),
		cookies: { get: vi.fn((key: string) => values[key]), set: vi.fn(), delete: vi.fn() },
		locals: { admin: null, accessToken: null }
	};
}
const json = (value: unknown, status = 200) =>
	new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

describe('admin sessions', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
	it('stores credentials in secure HttpOnly cookies', () => {
		const request = event();
		setSession(request as unknown as RequestEvent, {
			access_token: 'access',
			refresh_token: 'refresh',
			refresh_expires_in: 600
		});
		expect(request.cookies.set).toHaveBeenCalledWith(
			'aspa_admin_refresh',
			'refresh',
			expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 600 })
		);
	});
	it('rotates an expired session before authorizing the admin', async () => {
		const request = event({ aspa_admin_access: 'expired', aspa_admin_refresh: 'old-refresh' });
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(json({}, 401))
			.mockResolvedValueOnce(
				json({
					access_token: 'new-access',
					refresh_token: 'new-refresh',
					refresh_expires_in: 600,
					user: { is_admin: true }
				})
			)
			.mockResolvedValueOnce(json({ id: 'admin', is_admin: true }));
		vi.stubGlobal('fetch', fetcher);
		expect(await authenticate(request as unknown as RequestEvent)).toBe(true);
		expect(request.locals.accessToken).toBe('new-access');
		expect(request.cookies.set).toHaveBeenCalledWith(
			'aspa_admin_refresh',
			'new-refresh',
			expect.anything()
		);
	});
	it('rejects a refreshed regular-user session', async () => {
		const request = event({ aspa_admin_refresh: 'member-refresh' });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ user: { is_admin: false } })));
		expect(await authenticate(request as unknown as RequestEvent)).toBe(false);
		expect(request.locals.accessToken).toBeNull();
		expect(request.cookies.delete).toHaveBeenCalledTimes(2);
	});
	it('clears both credentials on logout', () => {
		const request = event();
		clearSession(request.cookies as unknown as RequestEvent['cookies']);
		expect(request.cookies.delete).toHaveBeenCalledWith('aspa_admin_access', { path: '/' });
		expect(request.cookies.delete).toHaveBeenCalledWith('aspa_admin_refresh', { path: '/' });
	});
});
