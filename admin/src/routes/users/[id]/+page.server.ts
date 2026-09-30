import { adminApi, readApi, type AdminUser } from '$lib/server/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	user: await readApi<AdminUser>(event, `/api/admin/users/${event.params.id}`)
});

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const response = await adminApi(event, `/api/admin/users/${event.params.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				is_active: form.get('is_active') === 'true',
				account_level: String(form.get('account_level') || '')
			})
		});
		if (!response.ok) return fail(response.status, { message: 'تغییر حساب انجام نشد.' });
		return { message: 'حساب به‌روزرسانی شد.' };
	}
};
