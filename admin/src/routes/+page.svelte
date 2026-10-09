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

<section>
	<header class="topbar">
		<div>
			<p class="eyebrow">مرکز کنترل اسپـا</p>
			<h1>خوش آمدید، {data.admin?.username || data.admin?.phone_number || 'مدیر'}</h1>
		</div>
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
</section>
