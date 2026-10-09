import { env } from '$env/dynamic/private';
import { requestApi, setSession } from '$lib/server/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ localLogin: env.ADMIN_LOCAL_LOGIN === 'true' });

export const actions: Actions = {
	request: async (event) => {
		const form = await event.request.formData();
		const phone_number = String(form.get('phone_number') || '');
		const response = await requestApi('/api/auth/login/otp/request', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phone_number })
		});
		if (!response.ok)
			return fail(response.status, {
				message: 'ارسال کد انجام نشد. شماره و زمان درخواست را بررسی کنید.',
				phone_number
			});
		return { message: 'کد ورود ارسال شد.', phone_number, requested: true };
	},
	verify: async (event) => {
		const form = await event.request.formData();
		const phone_number = String(form.get('phone_number') || '');
		const response = await requestApi('/api/auth/login/otp/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phone_number, code: String(form.get('code') || '') })
		});
		if (!response.ok)
			return fail(response.status, {
				message: 'کد نادرست یا منقضی است.',
				phone_number,
				requested: true
			});
		const session = await response.json();
		if (!session.user?.is_admin) {
			await requestApi('/api/auth/logout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: session.refresh_token })
			});
			return fail(403, { message: 'این حساب دسترسی مدیریت ندارد.', phone_number });
		}
		setSession(event, session);
		redirect(303, '/');
	},
	local: async (event) => {
		if (env.ADMIN_LOCAL_LOGIN !== 'true') return fail(403, { message: 'ورود محلی فعال نیست.' });
		const form = await event.request.formData();
		const response = await requestApi('/api/auth/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: String(form.get('username') || ''),
				password: String(form.get('password') || '')
			})
		});
		if (!response.ok)
			return fail(response.status, {
				message: 'ورود محلی انجام نشد. حساب نمونه و رمز را بررسی کنید.'
			});
		const session = await response.json();
		if (!session.user?.is_admin) return fail(403, { message: 'دسترسی مدیریت لازم است.' });
		setSession(event, session);
		redirect(303, '/');
	}
};
