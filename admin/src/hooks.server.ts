import { redirect, type Handle } from '@sveltejs/kit';
import { authenticate } from '$lib/server/api';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.admin = null;
	event.locals.accessToken = null;
	if (event.url.pathname === '/login' || event.url.pathname.startsWith('/_app/')) {
		return resolve(event);
	}
	const allowed = await authenticate(event);
	if (!allowed) redirect(303, '/login');
	return resolve(event);
};
