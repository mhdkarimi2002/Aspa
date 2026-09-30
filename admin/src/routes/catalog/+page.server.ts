import { adminApi, readApi, type Reference } from '$lib/server/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	muscles: await readApi<Reference[]>(event, '/api/admin/catalog/muscle-groups'),
	equipment: await readApi<Reference[]>(event, '/api/admin/catalog/equipment')
});

export const actions: Actions = {
	create: async (event) => {
		const form = await event.request.formData();
		const kind = String(form.get('kind') || '');
		if (!['muscle-groups', 'equipment'].includes(kind))
			return fail(400, { message: 'نوع نامعتبر است.' });
		const response = await adminApi(event, `/api/admin/catalog/${kind}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name_fa: String(form.get('name_fa') || '') })
		});
		if (!response.ok) return fail(response.status, { message: 'افزودن مورد انجام نشد.' });
		return { message: 'مورد افزوده شد.' };
	},
	update: async (event) => {
		const form = await event.request.formData();
		const kind = String(form.get('kind') || '');
		const id = String(form.get('id') || '');
		if (!['muscle-groups', 'equipment'].includes(kind) || !/^[0-9a-f-]{36}$/i.test(id)) {
			return fail(400, { message: 'درخواست نامعتبر است.' });
		}
		const response = await adminApi(event, `/api/admin/catalog/${kind}/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name_fa: String(form.get('name_fa') || ''),
				is_active: form.get('is_active') === 'true'
			})
		});
		if (!response.ok) return fail(response.status, { message: 'ویرایش مورد انجام نشد.' });
		return { message: 'مورد به‌روزرسانی شد.' };
	}
};
