<script lang="ts">
	import { resolve } from '$app/paths';
	import ExerciseForm from '$lib/ExerciseForm.svelte';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>ویرایش تمرین | آسپـا</title></svelte:head>
<main class="content-page">
	<a href={resolve('/exercises')}>← بازگشت به تمرین‌ها</a>
	<h1>ویرایش {data.exercise.name_fa}</h1>
	<p>
		این تمرین در {data.exercise.affected_plan_count} برنامه استفاده شده است. تغییرات، سابقهٔ تمرین‌های
		انجام‌شده را تغییر نمی‌دهد.
	</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<ExerciseForm exercise={data.exercise} muscles={data.muscles} equipment={data.equipment} />
</main>
