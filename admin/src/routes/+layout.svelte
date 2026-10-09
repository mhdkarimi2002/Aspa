<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page, navigating } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { busyCount, pendingSubmission } from '$lib/forms';
	import '../app.css';
	let { children, data } = $props();
	const links = [
		{ href: '/', label: 'نمای کلی' },
		{ href: '/users', label: 'کاربران' },
		{ href: '/exercises', label: 'تمرین‌ها' },
		{ href: '/catalog', label: 'عضلات و تجهیزات' },
		{ href: '/media', label: 'رسانه‌ها' },
		{ href: '/system', label: 'وضعیت سامانه' }
	] as const;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="پنل مدیریت اسپـا" />
</svelte:head>
{#if page.url.pathname === '/login'}
	{@render children()}
{:else}
	<a class="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
	<div class="shell">
		<aside class="sidebar">
			<a class="brand" href={resolve('/')}
				><span class="brand-mark">آ</span><span
					><strong>اسپـا</strong><small>پنل مدیریت</small></span
				></a
			>
			<nav aria-label="ناوبری اصلی">
				{#each links as link (link.href)}
					<a
						class="nav-item"
						class:active={link.href === '/'
							? page.url.pathname === '/'
							: page.url.pathname.startsWith(link.href)}
						aria-current={(
							link.href === '/'
								? page.url.pathname === '/'
								: page.url.pathname.startsWith(link.href)
						)
							? 'page'
							: undefined}
						href={resolve(link.href)}>{link.label}</a
					>
				{/each}
			</nav>
			<form method="POST" action="/?/logout" use:enhance={pendingSubmission}>
				<button type="submit" disabled={$busyCount > 0}>خروج</button>
			</form>
		</aside>
		<div id="main-content" class="admin-main" aria-busy={Boolean(navigating.to) || $busyCount > 0}>
			<p class="session-label">{data.admin?.username || data.admin?.phone_number || 'مدیر'}</p>
			{#if navigating.to || $busyCount > 0}<p class="pending-notice" role="status">
					در حال انجام…
				</p>{/if}
			{@render children()}
		</div>
	</div>
{/if}
