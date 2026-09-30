<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	const groups = [
		{ title: 'گروه‌های عضلانی', kind: 'muscle-groups' as const },
		{ title: 'تجهیزات', kind: 'equipment' as const }
	];
</script>

<svelte:head><title>عضلات و تجهیزات | آسپـا</title></svelte:head>
<main class="content-page">
	<a href={resolve('/exercises')}>← بازگشت به تمرین‌ها</a>
	<h1>مدیریت عضلات و تجهیزات</h1>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	{#each groups as group (group.kind)}
		<section>
			<h2>{group.title}</h2>
			<form method="POST" action="?/create" class="filters">
				<input type="hidden" name="kind" value={group.kind} />
				<label for="new-{group.kind}">نام فارسی</label>
				<input id="new-{group.kind}" name="name_fa" required />
				<button type="submit">افزودن</button>
			</form>
			<div class="data-list">
				{#each group.kind === 'muscle-groups' ? data.muscles : data.equipment as item (item.id)}
					<form method="POST" action="?/update" class="data-card">
						<input type="hidden" name="kind" value={group.kind} />
						<input type="hidden" name="id" value={item.id} />
						<label for="name-{item.id}">نام</label>
						<input id="name-{item.id}" name="name_fa" value={item.name_fa} required />
						<select name="is_active" aria-label="وضعیت" value={String(item.is_active)}>
							<option value="true">فعال</option><option value="false">غیرفعال</option>
						</select>
						<button type="submit">ذخیره</button>
					</form>
				{/each}
			</div>
		</section>
	{/each}
</main>
