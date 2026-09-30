<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>جزئیات کاربر | آسپـا</title></svelte:head>
<main class="content-page">
	<a href={resolve('/users')}>← بازگشت به کاربران</a>
	<h1>{data.user.username || data.user.phone_number || 'کاربر بدون نام'}</h1>
	<dl class="user-details">
		<dt>شمارهٔ تلفن</dt>
		<dd>{data.user.phone_number || 'ثبت نشده'}</dd>
		<dt>ایمیل</dt>
		<dd>{data.user.email || 'ثبت نشده'}</dd>
		<dt>نقش</dt>
		<dd>{data.user.is_admin ? 'مدیر' : 'کاربر'}</dd>
		<dt>تاریخ عضویت</dt>
		<dd>{new Date(data.user.created_at).toLocaleDateString('fa-IR')}</dd>
	</dl>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<form
		method="POST"
		class="edit-form"
		onsubmit={(event) => {
			if (!confirm('تغییرات حساب ذخیره شود؟')) event.preventDefault();
		}}
	>
		<label for="status">وضعیت حساب</label>
		<select id="status" name="is_active" value={String(data.user.is_active)}>
			<option value="true">فعال</option><option value="false">غیرفعال</option>
		</select>
		<label for="level">سطح اشتراک</label>
		<select id="level" name="account_level" value={data.user.account_level}>
			<option value="free">رایگان</option><option value="pro">حرفه‌ای</option>
		</select>
		<button type="submit">ذخیرهٔ تغییرات</button>
	</form>
</main>
