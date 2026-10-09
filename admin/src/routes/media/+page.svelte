<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { busyCount, pendingSubmission } from '$lib/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>رسانه‌ها | اسپـا</title></svelte:head>
<main class="content-page">
	<h1>رسانه‌های تمرین</h1>
	<p>تصویر یا نمایش حرکت را بارگذاری کنید؛ پس از بررسی، کلید آن را در فرم تمرین وارد کنید.</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<form
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		use:enhance={pendingSubmission}
		class="edit-form"
	>
		<label for="file">فایل GIF، MP4، PNG یا JPEG (حداکثر ۲۰ مگابایت)</label>
		<input
			id="file"
			name="file"
			type="file"
			accept="image/gif,video/mp4,image/png,image/jpeg"
			required
		/>
		<button type="submit" disabled={$busyCount > 0}>بارگذاری</button>
	</form>
	<div class="data-list">
		{#each data.assets as asset (asset.id)}
			<article class="data-card">
				<div>
					<p dir="ltr"><code>{asset.object_key}</code></p>
					<p>{Math.ceil(asset.size_bytes / 1024)} کیلوبایت</p>
					{#if asset.preview_url}
						{#if asset.content_type === 'video/mp4'}
							<video class="media-preview" controls preload="metadata" aria-label="نمایش حرکت"
								><source src={asset.preview_url} type="video/mp4" /><track kind="captions" /></video
							>
						{:else}<img
								class="media-preview"
								src={asset.preview_url}
								alt="پیش‌نمایش رسانهٔ تمرین"
								loading="lazy"
							/>{/if}
					{/if}
				</div>
				<form method="POST" action="?/review" use:enhance={pendingSubmission} class="edit-form">
					<input type="hidden" name="id" value={asset.id} />
					<label for={`review-${asset.id}`}>وضعیت بررسی</label>
					<select id={`review-${asset.id}`} name="review_status" value={asset.review_status}
						><option value="pending">در انتظار</option><option value="approved">تأییدشده</option
						><option value="rejected">ردشده</option></select
					>
					<label for={`rights-${asset.id}`}>حقوق استفاده</label>
					<select id={`rights-${asset.id}`} name="rights_status" value={asset.rights_status}
						><option value="unknown">نامشخص</option><option value="owned">تولید خودمان</option
						><option value="licensed">دارای مجوز</option><option value="public_domain"
							>مالکیت عمومی</option
						></select
					>
					<label for={`reference-${asset.id}`}>منبع یا مدرک حقوق استفاده</label>
					<input
						id={`reference-${asset.id}`}
						name="rights_reference"
						maxlength="1000"
						value={asset.rights_reference || ''}
					/>
					<button type="submit" disabled={$busyCount > 0}>ذخیرهٔ بررسی</button>
				</form>
			</article>
		{:else}<p>رسانه‌ای بارگذاری نشده است.</p>{/each}
	</div>
	<nav class="pagination" aria-label="صفحه‌های رسانه">
		{#if data.page > 1}<a href={resolve(`/media?page=${data.page - 1}`)}>صفحهٔ قبل</a>{/if}
		<span>صفحهٔ {data.page}</span>
		{#if data.assets.length === 20}<a href={resolve(`/media?page=${data.page + 1}`)}>صفحهٔ بعد</a
			>{/if}
	</nav>
</main>
