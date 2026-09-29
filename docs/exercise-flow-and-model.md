# Exercise Flow and Model

## Scope

The exercise domain supports two kinds of exercises:

- **Common exercises** are maintained by ASPA and visible to every user.
- **Custom exercises** are created by a user and visible only to that user.

Both kinds use the same muscle, instruction, media, workout-plan, and future
performance-history model. A custom exercise must never appear in another user's
search results, plans, history, or analytics.

## Exercise Content Requirements

Every publishable exercise should contain:

- A required Persian name.
- A required Persian how-to description.
- At least one primary muscle group.
- Zero or more secondary muscle groups. An empty secondary list is valid when no
  secondary muscle can be assigned accurately.
- At least one ordered instruction step.
- At least one demonstration asset in GIF or MP4 format.
- Optional equipment and a difficulty level.

The API enforces these content requirements when a user creates or updates a custom
exercise. Existing common catalog records may remain incomplete while catalog media
and instructions are being sourced, but they should not be considered ready for
publication until all required content is present.

## User Flows

### Browse and Inspect Exercises

1. The user opens the exercise library.
2. The app requests common exercises and the authenticated user's custom exercises.
3. The user may search, filter by muscle or equipment, and sort the results.
4. The user opens an exercise to see its muscles, description, ordered steps, and
   GIF or MP4 demonstration.

```text
Open exercise library
          ↓
Common exercises + my custom exercises
          ↓
Search / filter / sort
          ↓
Exercise details, steps, and demonstration
```

Anonymous requests can see common exercises only. An authenticated request can see
common exercises plus custom exercises owned by that user.

### Create a Custom Exercise

1. The authenticated user chooses **Create custom exercise**.
2. The user enters the name and how-to description.
3. The user selects at least one primary muscle and any accurate secondary muscles.
4. The user adds ordered instructions.
5. The user uploads or selects a GIF or MP4 demonstration.
6. The API stores the exercise with the user's ID as its owner.
7. The exercise becomes available in that user's library and workout-plan selector.

```text
Enter exercise content
          ↓
Select muscles
          ↓
Add steps and GIF/MP4
          ↓
Create owner-only exercise
          ↓
Available in my library and plans
```

Custom exercise rules:

- Only the owner can read, edit, use, or delete the custom exercise.
- Requests from other users return `404` so the exercise's existence is not exposed.
- Custom exercises are removed with the owning account.
- A custom exercise cannot be deleted while a saved workout plan references it.
- A custom exercise does not become part of the common catalog automatically.

### Add Exercises to a Workout Plan

1. The user selects common exercises or their own custom exercises.
2. The app adds them to one or more training days.
3. The workout-plan response recalculates muscle coverage.
4. The UI shows which muscles the routine hits as primary and secondary muscles.

```text
Select exercises
       ↓
Add to training days
       ↓
Aggregate exercise muscle mappings
       ↓
Show routine muscle coverage
```

Coverage counts exercise placements, not sets. If the same exercise appears on two
days, it contributes twice. Primary and secondary counts stay separate so the UI can
distinguish direct work from supporting work. Once completed workout data exists, a
future volume-based view may weight coverage by performed sets or training volume.

### View Exercise History and Progress

Exercise history must be derived from completed workout sets, not workout-plan
targets. This flow becomes available with live workout tracking:

1. The user opens an exercise.
2. The app requests that user's completed sets for the exercise.
3. The API returns paginated workout sessions and aggregate records.
4. The UI shows recent performance, personal records, and later a progress graph.

```text
Completed WorkoutSet rows
          ↓
Group by user + exercise + workout
          ↓
History and personal records
          ↓
Time-series graph
```

Planned records should include:

- Heaviest completed weight.
- Most completed repetitions at a given weight.
- Highest estimated one-repetition maximum (1RM).
- Highest completed set volume (`weight × repetitions`).
- Highest workout volume for the exercise.

Estimated 1RM should use one documented formula consistently. The initial formula is:

```text
estimated_1rm = weight × (1 + repetitions / 30)
```

Only completed, valid working sets should affect records. Warm-up sets, cancelled
workouts, deleted sets, and plan targets must not create records. Bodyweight and
assisted exercises will need an explicit load-calculation policy before weight-based
records are enabled for them.

## Data Model

### Exercise

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Unique exercise identifier. |
| `owner_user_id` | No | `NULL` for common exercises; user ID for private custom exercises. |
| `name_fa` | Yes | Persian display name. |
| `description_fa` | Yes for publishable content | Persian how-to summary. |
| `equipment_id` | No | Optional equipment reference. |
| `difficulty` | Yes | `beginner`, `intermediate`, or `advanced`. |
| `image_key` | No | Legacy image object key; new demonstrations use `ExerciseMedia`. |
| `video_key` | No | Legacy video object key; new demonstrations use `ExerciseMedia`. |
| `is_active` | Yes | Controls whether the exercise can be discovered or added to plans. |
| `created_at` | Yes | Creation time. |
| `updated_at` | Yes | Last update time. |

`owner_user_id` is the visibility boundary. It is never accepted from a client; the
API takes it from the authenticated user.

### ExerciseMuscle

| Field | Required | Description |
| --- | --- | --- |
| `exercise_id` | Yes | Exercise reference. |
| `muscle_group_id` | Yes | Muscle-group reference. |
| `is_primary` | Yes | `true` for a primary target and `false` for a secondary target. |

An exercise cannot list the same muscle as both primary and secondary. Duplicate
muscle references are rejected.

### ExerciseInstructionStep

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Unique step identifier. |
| `exercise_id` | Yes | Parent exercise. |
| `position` | Yes | Zero-based display order, unique within the exercise. |
| `text_fa` | Yes | Persian instruction text. |

### ExerciseMedia

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Unique media identifier. |
| `exercise_id` | Yes | Parent exercise. |
| `media_type` | Yes | `gif` or `mp4`. |
| `object_key` | Yes | Private or public object-storage key, never binary media. |
| `position` | Yes | Zero-based display order, unique within the exercise. |

Media files belong in S3-compatible object storage. PostgreSQL stores only object
keys and metadata. Upload validation should check MIME type, file size, duration,
dimensions, and ownership before an object key is attached to a custom exercise.

### Future Performance Models

Exercise history depends on the Phase 4 workout models:

```text
Exercise
   ↑
WorkoutExercise
   ↑
WorkoutSet
```

`WorkoutExercise` identifies the exercise performed in a workout. `WorkoutSet`
stores completed repetitions, weight, RPE/RIR, and completion time. Records and chart
points are calculated from those immutable completed-set facts; they are not stored
on `Exercise` itself.

## Visibility and Authorization

| Operation | Common exercise | Own custom exercise | Another user's custom exercise |
| --- | --- | --- | --- |
| List/search | Allowed | Allowed | Hidden |
| View details | Allowed | Allowed | `404` |
| Add to own plan | Allowed | Allowed | Rejected as not found |
| Edit | Catalog role only | Owner | `404` |
| Delete | Catalog role only | Owner, when unused | `404` |

Catalog-role enforcement is still required for common exercise mutations. Until that
role exists, common catalog write endpoints must be treated as internal tooling.

## API Contract

Implemented exercise endpoints:

- `GET /api/exercises` — common exercises plus the current user's custom exercises.
- `GET /api/exercises/{id}` — visible exercise details, muscles, steps, and media.
- `POST /api/exercises/custom` — create an owner-only custom exercise.
- `PATCH /api/exercises/{id}/custom` — update an owned custom exercise.
- `DELETE /api/exercises/{id}` — delete an authorized, unused exercise.
- `GET /api/muscle-groups` — active muscle-group references.
- `GET /api/equipment` — active equipment references.

Workout-plan responses include `muscle_coverage`, with primary and secondary exercise
counts for each muscle group.

Planned after workout tracking exists:

- `GET /api/exercises/{id}/history`
- `GET /api/exercises/{id}/records`
- `GET /api/exercises/{id}/progress?metric=estimated_1rm&range=6m`

History endpoints must always scope queries by the authenticated user, paginate raw
history, use deterministic ordering, and avoid exposing another user's workout data.

## Model Rules

- A common exercise has no owner; a custom exercise has exactly one owner.
- Custom exercises are private and cannot be shared by guessing an ID.
- Every publishable exercise has a name, how-to description, primary muscles,
  ordered steps, and at least one GIF or MP4 demonstration.
- Secondary muscles are represented explicitly and remain empty when none apply.
- Demonstration binaries are never stored in PostgreSQL.
- Only common exercises and the current user's custom exercises can be added to that
  user's workout plans.
- Routine muscle coverage keeps primary and secondary work separate.
- Exercise records come only from completed workout sets.
- Progress charts are a presentation of historical set-derived metrics, not a
  separate source of truth.
