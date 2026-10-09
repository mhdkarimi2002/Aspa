<script lang="ts">
	import { enhance } from '$app/forms';
	import { busyCount, pendingSubmission } from '$lib/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>ورود مدیر | اسپـا</title></svelte:head>
<main class="login-card">
	<p class="eyebrow">پنل مدیریت اسپـا</p>
	<h1>ورود مدیر</h1>
	<p>با شمارهٔ حساب مدیر و کد یک‌بارمصرف وارد شوید.</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<form method="POST" action="?/request" use:enhance={pendingSubmission}>
		<label for="phone">شمارهٔ همراه</label>
		<input
			id="phone"
			name="phone_number"
			type="tel"
			dir="ltr"
			autocomplete="tel"
			required
			value={form?.phone_number || ''}
		/>
		<button disabled={$busyCount > 0} type="submit">ارسال کد ورود</button>
	</form>
	{#if form?.requested}
		<form method="POST" action="?/verify" use:enhance={pendingSubmission}>
			<input type="hidden" name="phone_number" value={form.phone_number} />
			<label for="code">کد ورود</label>
			<input
				id="code"
				name="code"
				inputmode="numeric"
				autocomplete="one-time-code"
				required
				minlength="5"
				maxlength="5"
				dir="ltr"
			/>
			<button disabled={$busyCount > 0} type="submit">ورود به پنل</button>
		</form>
	{/if}
	{#if data.localLogin}
		<details>
			<summary>ورود توسعهٔ محلی</summary>
			<form method="POST" action="?/local" use:enhance={pendingSubmission}>
				<label for="username">نام کاربری</label><input
					id="username"
					name="username"
					autocomplete="username"
					required
				/>
				<label for="password">رمز عبور</label><input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>
				<button disabled={$busyCount > 0} type="submit">ورود محلی</button>
			</form>
		</details>
	{/if}
</main>
