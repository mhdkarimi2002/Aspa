<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const names: Record<string, string> = {
		database: 'پایگاه داده',
		redis: 'ردیس',
		storage: 'ذخیره‌سازی رسانه'
	};
</script>

<svelte:head><title>وضعیت سامانه | اسپـا</title></svelte:head>
<main class="content-page">
	<h1>وضعیت سامانه</h1>
	<div class="data-list">
		{#each Object.entries(data.system.checks) as [name, status] (name)}<p>
				{names[name] || name}: {status}
			</p>{/each}
	</div>
	<h2>ردیس</h2>
	{#each Object.entries(data.system.redis) as [name, value] (name)}<p dir="ltr">
			{name}: {value}
		</p>{/each}
	<h2>درخواست‌ها</h2>
	<p>آمار این نمونهٔ API از زمان راه‌اندازی آن محاسبه می‌شود.</p>
	<div class="table-scroll">
		<table>
			<thead><tr><th>مسیر</th><th>تعداد</th><th>میانگین زمان (ثانیه)</th></tr></thead><tbody>
				{#each Object.entries(data.system.requests) as [key, count] (key)}<tr
						><td dir="ltr">{key}</td><td>{count}</td><td
							>{((data.system.request_seconds[key] || 0) / count).toFixed(3)}</td
						></tr
					>{/each}
			</tbody>
		</table>
	</div>
</main>
