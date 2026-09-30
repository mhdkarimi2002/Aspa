import { adminApi, readApi, type Exercise, type Page } from '$lib/server/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const query = new URLSearchParams();
	for (const key of ['page', 'search', 'is_active']) {
		const value = event.url.searchParams.get(key);
		if (value) query.set(key, value);
	}
	return {
		exercises: await readApi<Page<Exercise>>(event, `/api/admin/exercises?${query}`),
		search: event.url.searchParams.get('search') || '',
		status: event.url.searchParams.get('is_active') || ''
	};
};

export const actions: Actions = {
	status: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('id') || '');
		if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(400, { message: 'شناسه نامعتبر است.' });
		const response = await adminApi(event, `/api/admin/exercises/${id}/status`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ is_active: form.get('is_active') === 'true' })
		});
		if (!response.ok) return fail(response.status, { message: 'تغییر وضعیت انجام نشد.' });
		return { message: 'وضعیت تمرین به‌روزرسانی شد.' };
	}
};
