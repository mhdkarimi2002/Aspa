import { adminApi, readApi } from '$lib/server/api';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type MediaAsset = {
	id: string;
	object_key: string;
	content_type: string;
	size_bytes: number;
	review_status: string;
	rights_status: string;
	rights_reference: string | null;
	preview_url: string | null;
};
export const load: PageServerLoad = async (event) => {
	const parsed = Number(event.url.searchParams.get('page') || 1);
	const page = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
	return {
		page,
		assets: await readApi<MediaAsset[]>(
			event,
			`/api/admin/media?limit=20&offset=${(page - 1) * 20}`
		)
	};
};
export const actions: Actions = {
	upload: async (event) => {
		const form = await event.request.formData();
		const file = form.get('file');
		if (!(file instanceof File) || file.size === 0 || file.size > 20 * 1024 * 1024)
			return fail(400, { message: 'یک فایل معتبر با حجم حداکثر ۲۰ مگابایت انتخاب کنید.' });
		const payload = new FormData();
		payload.set('file', file);
		const response = await adminApi(event, '/api/admin/media', { method: 'POST', body: payload });
		if (!response.ok)
			return fail(response.status, {
				message: 'بارگذاری انجام نشد. نوع فایل، حجم و اتصال ذخیره‌سازی را بررسی کنید.'
			});
		return { message: 'فایل بارگذاری شد. حقوق استفاده و بررسی آن را تکمیل کنید.' };
	},
	review: async (event) => {
		const form = await event.request.formData();
		const id = String(form.get('id') || '');
		if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(400, { message: 'شناسه نامعتبر است.' });
		const response = await adminApi(event, `/api/admin/media/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				review_status: form.get('review_status'),
				rights_status: form.get('rights_status'),
				rights_reference: String(form.get('rights_reference') || '') || null
			})
		});
		if (!response.ok)
			return fail(response.status, {
				message: 'بررسی ذخیره نشد. تأیید نیازمند ثبت مدرک حقوق استفاده است.'
			});
		return { message: 'وضعیت بررسی ذخیره شد.' };
	}
};
