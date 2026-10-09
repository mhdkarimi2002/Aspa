<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head><title>خطا | اسپـا</title></svelte:head>
<section class="content-page" role="alert">
	<h1>دریافت اطلاعات انجام نشد</h1>
	<p>
		{page.status === 404
			? 'صفحه یا رکورد پیدا نشد.'
			: 'اتصال یا درخواست با خطا روبه‌رو شد. دوباره تلاش کنید.'}
	</p>
	<button type="button" onclick={() => window.location.reload()}>تلاش دوباره</button>
	<a href={resolve('/')}>بازگشت به پنل</a>
</section>
