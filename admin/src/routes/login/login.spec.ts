import { beforeEach, expect, it, vi } from 'vitest';
import type { RequestEvent } from './$types';

vi.mock('$env/dynamic/private', () => ({ env: { ADMIN_LOCAL_LOGIN: 'false' } }));
vi.mock('$lib/server/api', () => ({ requestApi: vi.fn(), setSession: vi.fn() }));
import { requestApi, setSession } from '$lib/server/api';
import { actions } from './+page.server';

beforeEach(() => vi.resetAllMocks());
function event() {
	const data = new FormData();
	data.set('phone_number', '09120000000');
	data.set('code', '11111');
	return { request: { formData: async () => data } } as unknown as RequestEvent;
}
it('does not establish an admin session for a regular user', async () => {
	vi.mocked(requestApi)
		.mockResolvedValueOnce(
			new Response(JSON.stringify({ user: { is_admin: false }, refresh_token: 'member-token' }))
		)
		.mockResolvedValueOnce(new Response(null, { status: 204 }));
	const result = await actions.verify!(event());
	expect(result).toMatchObject({ status: 403 });
	expect(setSession).not.toHaveBeenCalled();
	expect(requestApi).toHaveBeenLastCalledWith(
		'/api/auth/logout',
		expect.objectContaining({ method: 'POST' })
	);
});
it('disables local password login without the explicit development setting', async () => {
	const result = await actions.local!(event());
	expect(result).toMatchObject({ status: 403 });
	expect(requestApi).not.toHaveBeenCalled();
});
