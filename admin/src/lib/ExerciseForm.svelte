<script lang="ts">
	import type { Exercise, Reference } from '$lib/server/api';
	let {
		exercise = null,
		muscles,
		equipment
	}: {
		exercise?: Exercise | null;
		muscles: Reference[];
		equipment: Reference[];
	} = $props();
</script>

<form method="POST" class="edit-form">
	{#if exercise}<input type="hidden" name="is_active" value={String(exercise.is_active)} />{/if}
	<label for="name">نام فارسی</label>
	<input id="name" name="name_fa" required maxlength="200" value={exercise?.name_fa || ''} />
	<label for="description">توضیح انجام حرکت</label>
	<textarea id="description" name="description_fa" rows="4"
		>{exercise?.description_fa || ''}</textarea
	>
	<label for="difficulty">درجهٔ سختی</label>
	<select id="difficulty" name="difficulty" value={exercise?.difficulty || 'beginner'}>
		<option value="beginner">مبتدی</option><option value="intermediate">متوسط</option><option
			value="advanced">پیشرفته</option
		>
	</select>
	<label for="equipment">تجهیزات</label>
	<select id="equipment" name="equipment_id" value={exercise?.equipment?.id || ''}>
		<option value="">بدون تجهیزات</option>
		{#each equipment.filter((item) => item.is_active !== false) as item (item.id)}<option
				value={item.id}>{item.name_fa}</option
			>{/each}
	</select>
	<label for="primary">عضلات اصلی (انتخاب چندگانه)</label>
	<select id="primary" name="primary_muscle_ids" multiple required size="6">
		{#each muscles.filter((item) => item.is_active !== false) as item (item.id)}<option
				value={item.id}
				selected={exercise?.primary_muscles.some((muscle) => muscle.id === item.id) || false}
				>{item.name_fa}</option
			>{/each}
	</select>
	<label for="secondary">عضلات فرعی (انتخاب چندگانه)</label>
	<select id="secondary" name="secondary_muscle_ids" multiple size="6">
		{#each muscles.filter((item) => item.is_active !== false) as item (item.id)}<option
				value={item.id}
				selected={exercise?.secondary_muscles.some((muscle) => muscle.id === item.id) || false}
				>{item.name_fa}</option
			>{/each}
	</select>
	<label for="steps">مراحل انجام (هر مرحله در یک خط)</label>
	<textarea id="steps" name="instruction_steps" rows="6"
		>{exercise?.instruction_steps.map((step) => step.text_fa).join('\n') || ''}</textarea
	>
	<label for="media">رسانه (هر خط: نوع|کلید فایل، مانند gif|exercises/example.gif)</label>
	<textarea id="media" name="media" rows="4"
		>{exercise?.media.map((item) => `${item.media_type}|${item.object_key}`).join('\n') ||
			''}</textarea
	>
	<button type="submit">ذخیرهٔ تمرین</button>
</form>
