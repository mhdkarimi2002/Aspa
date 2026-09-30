<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sections = [
		{
			title: 'کاربران',
			description: 'جست‌وجو، مشاهده وضعیت حساب و مدیریت دسترسی کاربران',
			phase: 'فاز ۱',
			tone: 'mint',
			url: '/users'
		},
		{
			title: 'تمرین‌ها',
			description: 'مدیریت تمرین‌های عمومی، عضلات، تجهیزات و رسانه‌ها',
			phase: 'فاز ۲',
			tone: 'blue',
			url: '/exercises'
		}
	] as const;
</script>

<svelte:head>
	<title>پنل مدیریت اسپـا</title>
</svelte:head>

<div class="shell">
	<aside class="sidebar">
		<a class="brand" href={resolve('/')} aria-label="صفحه اصلی پنل مدیریت اسپـا">
			<span class="brand-mark">آ</span>
			<span>
				<strong>اسپـا</strong>
				<small>پنل مدیریت</small>
			</span>
		</a>

		<nav aria-label="ناوبری اصلی">
			<a class="nav-item active" href={resolve('/')} aria-current="page">نمای کلی</a>
			<a class="nav-item" href={resolve('/users')}>کاربران</a>
			<a class="nav-item" href={resolve('/exercises')}>تمرین‌ها</a>
		</nav>

		<div class="sidebar-note">
			<span class="status-dot"></span>
			<div>
				<strong>زیرساخت اولیه</strong>
				<small>اتصال امن پس از تکمیل نقش مدیر</small>
			</div>
		</div>
	</aside>

	<main>
		<header class="topbar">
			<div>
				<p class="eyebrow">مرکز کنترل اسپـا</p>
				<h1>خوش آمدید، {data.admin?.username || data.admin?.phone_number || 'مدیر'}</h1>
			</div>
			<form method="POST" action="?/logout"><button type="submit">خروج</button></form>
		</header>

		<section class="notice" aria-labelledby="notice-title">
			<div class="notice-icon">!</div>
			<div>
				<h2 id="notice-title">مدیریت کاربران و تمرین‌ها</h2>
				<p>از بخش‌های زیر می‌توانید حساب‌ها و تمرین‌های عمومی را مدیریت کنید.</p>
			</div>
		</section>

		<section aria-labelledby="areas-title">
			<div class="section-heading">
				<div>
					<p class="eyebrow">نقشهٔ توسعه</p>
					<h2 id="areas-title">حوزه‌های مدیریتی</h2>
				</div>
				<span>۲ حوزه</span>
			</div>

			<div class="cards">
				{#each sections as section (section.title)}
					<a class="card {section.tone}" href={resolve(section.url)}>
						<div class="card-top">
							<span class="card-icon" aria-hidden="true"></span>
							<span class="phase">{section.phase}</span>
						</div>
						<h3>{section.title}</h3>
						<p>{section.description}</p>
						<footer>ورود به بخش</footer>
					</a>
				{/each}
			</div>
		</section>
	</main>
</div>
