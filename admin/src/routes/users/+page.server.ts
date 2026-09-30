import { adminApi, readApi, type AdminUser, type Page } from '$lib/server/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const query = new URLSearchParams();
	for (const key of ['page', 'search', 'is_active']) {
		const value = event.url.searchParams.get(key);
		if (value) query.set(key, value);
	}
	const users = await readApi<Page<AdminUser>>(event, `/api/admin/users?${query}`);
	return {
		users,
		search: event.url.searchParams.get('search') || '',
		status: event.url.searchParams.get('is_active') || ''
	};
};

export const actions: Actions = {
	update: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('id') || '');
		const field = String(form.get('field') || '');
		const value = String(form.get('value') || '');
		if (!/^[0-9a-f-]{36}$/i.test(id) || !['is_active', 'account_level'].includes(field)) {
			return fail(400, { message: 'درخواست نامعتبر است.' });
		}
		const body = { [field]: field === 'is_active' ? value === 'true' : value };
		const response = await adminApi(event, `/api/admin/users/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) return fail(response.status, { message: 'تغییر حساب انجام نشد.' });
		return { message: 'اطلاعات کاربر به‌روزرسانی شد.' };
	}
};
