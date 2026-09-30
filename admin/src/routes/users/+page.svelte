<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>مدیریت کاربران | آسپـا</title></svelte:head>

<main class="content-page">
	<a href={resolve('/')}>← بازگشت به پنل</a>
	<h1>مدیریت کاربران</h1>
	<p>تعداد کل: {data.users.total}</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<form method="GET" class="filters">
		<label for="search">جست‌وجو</label>
		<input id="search" name="search" value={data.search} placeholder="شماره، نام کاربری یا ایمیل" />
		<label for="status">وضعیت</label>
		<select id="status" name="is_active" value={data.status}>
			<option value="">همه</option>
			<option value="true">فعال</option>
			<option value="false">غیرفعال</option>
		</select>
		<button type="submit">اعمال فیلتر</button>
	</form>
	<div class="data-list">
		{#each data.users.items as user (user.id)}
			<article class="data-card">
				<div>
					<h2>
						<a href={resolve(`/users/${user.id}`)}
							>{user.username || user.phone_number || 'کاربر بدون نام'}</a
						>
					</h2>
					<p>{user.phone_number || 'بدون شماره'} · {user.email || 'بدون ایمیل'}</p>
					<small>ثبت‌نام: {new Date(user.created_at).toLocaleDateString('fa-IR')}</small>
				</div>
				<div class="row-actions">
					<span>{user.is_admin ? 'مدیر' : 'کاربر'} · {user.is_active ? 'فعال' : 'غیرفعال'}</span>
					<form
						method="POST"
						action="?/update"
						onsubmit={(event) => {
							if (!confirm('وضعیت حساب تغییر کند؟')) event.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={user.id} />
						<input type="hidden" name="field" value="is_active" />
						<input type="hidden" name="value" value={String(!user.is_active)} />
						<button type="submit">{user.is_active ? 'غیرفعال کردن' : 'فعال کردن'}</button>
					</form>
					<form method="POST" action="?/update">
						<input type="hidden" name="id" value={user.id} />
						<input type="hidden" name="field" value="account_level" />
						<select name="value" aria-label="سطح اشتراک" value={user.account_level}>
							<option value="free">رایگان</option>
							<option value="pro">حرفه‌ای</option>
						</select>
						<button type="submit">ذخیره سطح</button>
					</form>
				</div>
			</article>
		{:else}
			<p>کاربری پیدا نشد.</p>
		{/each}
	</div>
	<nav class="pagination" aria-label="صفحه‌ها">
		{#if data.users.page > 1}<form method="GET">
				<input type="hidden" name="page" value={data.users.page - 1} /><input
					type="hidden"
					name="search"
					value={data.search}
				/><input type="hidden" name="is_active" value={data.status} /><button type="submit"
					>صفحهٔ قبل</button
				>
			</form>{/if}
		<span>صفحهٔ {data.users.page} از {Math.max(1, data.users.pages)}</span>
		{#if data.users.page < data.users.pages}<form method="GET">
				<input type="hidden" name="page" value={data.users.page + 1} /><input
					type="hidden"
					name="search"
					value={data.search}
				/><input type="hidden" name="is_active" value={data.status} /><button type="submit"
					>صفحهٔ بعد</button
				>
			</form>{/if}
	</nav>
</main>
