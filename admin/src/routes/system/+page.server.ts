import { readApi } from '$lib/server/api';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async (event) => ({
	system: await readApi<{
		checks: Record<string, string>;
		redis: Record<string, number>;
		requests: Record<string, number>;
		request_seconds: Record<string, number>;
	}>(event, '/api/admin/system')
});
