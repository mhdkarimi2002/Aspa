import { adminApi, readApi, type Reference } from '$lib/server/api';
import { parseExerciseForm } from '$lib/server/exercise-form';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	muscles: await readApi<Reference[]>(event, '/api/admin/catalog/muscle-groups'),
	equipment: await readApi<Reference[]>(event, '/api/admin/catalog/equipment')
});

export const actions: Actions = {
	default: async (event) => {
		const data = parseExerciseForm(await event.request.formData());
		const response = await adminApi(event, '/api/admin/exercises', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (!response.ok)
			return fail(response.status, { message: 'تمرین ذخیره نشد. داده‌های فرم را بررسی کنید.' });
		redirect(303, '/exercises');
	}
};
