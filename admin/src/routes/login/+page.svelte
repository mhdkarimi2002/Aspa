<script lang="ts">
	let { form } = $props();
</script>

<svelte:head><title>ورود مدیر | آسپـا</title></svelte:head>

<main class="login-card">
	<p class="eyebrow">پنل مدیریت آسپـا</p>
	<h1>ورود مدیر</h1>
	<p>نام کاربری و رمز عبور مدیر محلی را وارد کنید.</p>
	{#if form?.message}<p role="alert">{form.message}</p>{/if}
	<form method="POST" action="/login">
		<label for="username">نام کاربری</label>
		<input id="username" name="username" autocomplete="username" required value={form?.username || ''} />
		<label for="password">رمز عبور</label>
		<input id="password" name="password" type="password" autocomplete="current-password" required />
		<button type="submit">ورود به پنل</button>
	</form>
</main>
