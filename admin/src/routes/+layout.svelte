<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta
		name="description"
		content="پنل مدیریت اسپـا برای مدیریت امن کاربران، تمرین‌ها و عملیات سامانه"
	/>
</svelte:head>

{@render children()}
