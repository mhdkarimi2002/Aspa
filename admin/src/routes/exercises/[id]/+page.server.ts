import { adminApi, readApi, type Exercise, type Reference } from '$lib/server/api';
import { parseExerciseForm } from '$lib/server/exercise-form';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
	exercise: await readApi<Exercise>(event, `/api/admin/exercises/${event.params.id}`),
	muscles: await readApi<Reference[]>(event, '/api/admin/catalog/muscle-groups'),
	equipment: await readApi<Reference[]>(event, '/api/admin/catalog/equipment')
});

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const data = parseExerciseForm(form);
		const response = await adminApi(event, `/api/admin/exercises/${event.params.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...data, is_active: form.get('is_active') === 'true' })
		});
		if (!response.ok)
			return fail(response.status, {
				message: 'ویرایش تمرین انجام نشد. داده‌های فرم را بررسی کنید.'
			});
		return { message: 'تمرین به‌روزرسانی شد.' };
	}
};
