import { requestApi, setSession } from '$lib/server/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.admin) redirect(303, '/');
};

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const username = String(form.get('username') || '');
		const password = String(form.get('password') || '');
		const response = await requestApi('/api/auth/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		if (!response.ok) {
			return fail(response.status, {
				message:
					response.status === 503
						? 'حساب مدیر محلی آماده نیست. داده‌های نمونه را وارد کنید.'
						: 'نام کاربری یا رمز عبور نادرست است.',
				username
			});
		}
		setSession(event, await response.json());
		redirect(303, '/');
	}
};
