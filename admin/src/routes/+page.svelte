<script lang="ts">
	const sections = [
		{
			title: 'کاربران',
			description: 'جست‌وجو، مشاهده وضعیت حساب و مدیریت دسترسی کاربران',
			phase: 'فاز ۱',
			tone: 'mint'
		},
		{
			title: 'تمرین‌ها',
			description: 'مدیریت تمرین‌های عمومی، عضلات، تجهیزات و رسانه‌ها',
			phase: 'فاز ۲',
			tone: 'blue'
		}
	] as const;
</script>

<svelte:head>
	<title>پنل مدیریت اسپـا</title>
</svelte:head>

<div class="shell">
	<aside class="sidebar">
		<a class="brand" href="/" aria-label="صفحه اصلی پنل مدیریت اسپـا">
			<span class="brand-mark">آ</span>
			<span>
				<strong>اسپـا</strong>
				<small>پنل مدیریت</small>
			</span>
		</a>

		<nav aria-label="ناوبری اصلی">
			<a class="nav-item active" href="/" aria-current="page">نمای کلی</a>
			<span class="nav-item disabled">کاربران</span>
			<span class="nav-item disabled">تمرین‌ها</span>
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
				<h1>صبح بخیر، مدیر</h1>
			</div>
			<div class="environment">محیط توسعه</div>
		</header>

		<section class="notice" aria-labelledby="notice-title">
			<div class="notice-icon">!</div>
			<div>
				<h2 id="notice-title">پنل آمادهٔ توسعه است</h2>
				<p>
					صفحه‌های عملیاتی پس از اضافه‌شدن احراز هویت مدیر، سطح‌بندی دسترسی و ثبت رخدادهای
					حسابرسی فعال می‌شوند.
				</p>
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
				{#each sections as section}
					<article class="card {section.tone}">
						<div class="card-top">
							<span class="card-icon" aria-hidden="true"></span>
							<span class="phase">{section.phase}</span>
						</div>
						<h3>{section.title}</h3>
						<p>{section.description}</p>
						<footer>برنامه‌ریزی شده</footer>
					</article>
				{/each}
			</div>
		</section>

		<section class="principles" aria-labelledby="principles-title">
			<div>
				<p class="eyebrow">اصل طراحی</p>
				<h2 id="principles-title">دسترسی حداقلی، ردپای کامل</h2>
			</div>
			<p>
				هر عملیات حساس مدیر باید در بک‌اند مجوزسنجی و ثبت شود. پنل هرگز جایگزین کنترل دسترسی
				سمت سرور نخواهد بود.
			</p>
		</section>
	</main>
</div>
