<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>مدیریت تمرین‌ها | آسپـا</title></svelte:head>

<main class="content-page">
	<a href={resolve('/')}>← بازگشت به پنل</a>
	<div class="topbar">
		<h1>مدیریت تمرین‌های عمومی</h1>
		<a class="button-link" href={resolve('/exercises/new')}>افزودن تمرین</a>
	</div>
	<p>تعداد کل: {data.exercises.total}</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<form method="GET" class="filters">
		<label for="search">جست‌وجو</label>
		<input id="search" name="search" value={data.search} placeholder="نام تمرین" />
		<label for="status">وضعیت</label>
		<select id="status" name="is_active" value={data.status}>
			<option value="">همه</option><option value="true">فعال</option><option value="false"
				>غیرفعال</option
			>
		</select>
		<button type="submit">اعمال فیلتر</button>
	</form>
	<div class="data-list">
		{#each data.exercises.items as exercise (exercise.id)}
			<article class="data-card">
				<div>
					<h2><a href={resolve(`/exercises/${exercise.id}`)}>{exercise.name_fa}</a></h2>
					<p>
						{exercise.equipment?.name_fa || 'بدون تجهیزات'} · {exercise.primary_muscles
							.map((muscle) => muscle.name_fa)
							.join('، ')}
					</p>
				</div>
				<div class="row-actions">
					<span>{exercise.is_active ? 'فعال' : 'غیرفعال'}</span>
					<form
						method="POST"
						action="?/status"
						onsubmit={(event) => {
							if (!confirm('وضعیت تمرین تغییر کند؟')) event.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={exercise.id} />
						<input type="hidden" name="is_active" value={String(!exercise.is_active)} />
						<button type="submit">{exercise.is_active ? 'غیرفعال کردن' : 'فعال کردن'}</button>
					</form>
				</div>
			</article>
		{:else}<p>تمرینی پیدا نشد.</p>{/each}
	</div>
	<nav class="pagination" aria-label="صفحه‌ها">
		{#if data.exercises.page > 1}<form method="GET">
				<input type="hidden" name="page" value={data.exercises.page - 1} /><input
					type="hidden"
					name="search"
					value={data.search}
				/><input type="hidden" name="is_active" value={data.status} /><button type="submit"
					>صفحهٔ قبل</button
				>
			</form>{/if}
		<span>صفحهٔ {data.exercises.page} از {Math.max(1, data.exercises.pages)}</span>
		{#if data.exercises.page < data.exercises.pages}<form method="GET">
				<input type="hidden" name="page" value={data.exercises.page + 1} /><input
					type="hidden"
					name="search"
					value={data.search}
				/><input type="hidden" name="is_active" value={data.status} /><button type="submit"
					>صفحهٔ بعد</button
				>
			</form>{/if}
	</nav>
	<p><a href={resolve('/catalog')}>مدیریت عضلات و تجهیزات</a></p>
</main>
