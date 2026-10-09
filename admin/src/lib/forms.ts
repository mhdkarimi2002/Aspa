import type { SubmitFunction } from '@sveltejs/kit';
import { writable } from 'svelte/store';

export const busyCount = writable(0);
export const pendingSubmission: SubmitFunction = () => {
	busyCount.update((count) => count + 1);
	return async ({ update, result }) => {
		try {
			await update({ reset: result.type === 'success', invalidateAll: true });
		} finally {
			busyCount.update((count) => Math.max(0, count - 1));
		}
	};
};
