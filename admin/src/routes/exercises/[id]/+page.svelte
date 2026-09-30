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
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	<ExerciseForm exercise={data.exercise} muscles={data.muscles} equipment={data.equipment} />
</main>
