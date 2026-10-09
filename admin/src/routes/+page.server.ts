import { requestApi, clearSession } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({ admin: locals.admin });

export const actions: Actions = {
	logout: async ({ cookies }) => {
		const refresh = cookies.get('aspa_admin_refresh');
		try {
			if (refresh) {
				await requestApi('/api/auth/logout', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refresh_token: refresh })
				});
			}
		} catch {
			// Clear the browser session even when the API is temporarily unreachable.
		} finally {
			clearSession(cookies);
		}
		redirect(303, '/login');
	}
};
