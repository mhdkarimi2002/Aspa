export function parseExerciseForm(form: FormData) {
	const media = String(form.get('media') || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const separator = line.indexOf('|');
			return {
				media_type: line.slice(0, separator).trim(),
				object_key: line.slice(separator + 1).trim()
			};
		});
	return {
		name_fa: String(form.get('name_fa') || '').trim(),
		description_fa: String(form.get('description_fa') || '').trim() || null,
		difficulty: String(form.get('difficulty') || 'beginner'),
		equipment_id: String(form.get('equipment_id') || '') || null,
		primary_muscle_ids: form.getAll('primary_muscle_ids').map(String),
		secondary_muscle_ids: form.getAll('secondary_muscle_ids').map(String),
		instruction_steps: String(form.get('instruction_steps') || '')
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((text_fa) => ({ text_fa })),
		media
	};
}
