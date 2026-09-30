# Workout Plan Flow and Model

## Scope and Current Status

A workout plan is one reusable, ordered exercise list. It is not assigned to a
weekday and is never "used up" by completing it. Each start creates a separate
workout run. Finishing that run records its date and duration in the user's
history without changing the plan. Plan values are targets, not completed
performance or personal records.

The current API supports creating, editing, deleting, duplicating, and activating
plans; managing one exercise list per plan; configuring set counts, repetition
ranges, per-set target repetitions and weights, and rest periods; summarizing
muscle coverage; sharing and importing fixed versions; and starting, finishing,
cancelling, and listing workout runs with date and duration. The user-facing
sharing, per-set editing, and live timer screens are not yet implemented. Actual
set logging and exercise-progress history remain future work.

## User Flows

### Create and Edit a Plan

1. The user enters a plan name and an optional description.
2. The user selects and orders exercises from the common library or their own
   private exercises. No day of the week is required.
3. For each exercise, the user sets the number of sets and each set's target
   repetitions and weight. Rest time and notes are optional.
4. The plan view shows the primary and secondary muscles targeted by its exercises.
5. The owner can edit, duplicate, archive, or delete the plan and its exercises.

The set count must match the number of target-set rows. Increasing the count may
copy suggested values from the last set, but each new set remains editable.
Reducing the count requires confirmation before extra rows are removed. Weight is
stored in kilograms using a fixed-precision numeric type. Zero is valid for an
unweighted movement; a missing value means that no weight target was set.
Repetitions must be positive integers. An empty plan may remain a draft, but a
workout cannot start until the plan contains at least one valid exercise.

### Share and Add a Plan to My List

1. The owner creates a share link for an eligible plan. Plans are private by
   default.
2. A recipient opens the link, reviews the plan, and explicitly chooses to add
   it to their own plan list.
3. The system creates an independent copy owned by the recipient. Later edits to
   the source do not change the copy. Neither user's workout history is copied.
4. The owner can revoke the link. Revocation stops new access but does not delete
   copies that recipients have already added.

Only plans composed entirely of common-library exercises can be shared. If a
plan contains a private custom exercise, link creation is blocked until that
exercise is removed or replaced. The private exercise's name, instructions, and
media must not be exposed to recipients. Share links must be unguessable,
revocable, and optionally time-limited. A shared view contains plan content only,
not the owner's phone number, account details, or workout history. The published
version is fixed when the link is created; publishing later edits requires a new
version or link.

### Start and Finish a Workout

1. The user selects any non-archived plan in their list and presses Start. The
   plan does not need to be the user's currently marked active plan.
2. The start time is saved and a duration timer begins. Leaving the screen or
   backgrounding the app does not restart the timer.
3. The run keeps a snapshot of the plan name. Editing the plan does not rename
   past runs.
4. Finishing the run saves its completion date and duration. The same plan can
   be started again immediately, creating another history entry.
5. Cancelling a run excludes it from completed-workout history. The plan remains
   unchanged in either case.

Only one workout may be in progress per user. Reopening the app must restore that
run and its original start time. A client-generated identifier makes repeated
start requests idempotent. Duration is calculated from valid server-side start
and completion timestamps, not from the on-screen timer alone. Recording actual
sets, reps, and weights during the run is a later live-tracking extension; it
must not overwrite plan targets.

### View History and Progress

Users can review completed runs of the same plan, including the completion date
and duration of each run. Later, actual completed sets can support exercise
records and charts. Plan targets, cancelled runs, and other users' data must
never contribute to performance records. Weight and volume calculations are in the
[exercise flow and model](exercise-flow-and-model.md).

## Data Model

| Entity | Purpose and key data | Status |
| --- | --- | --- |
| `WorkoutPlan` | Owner, name, description, active/archive state, creation and update times | Implemented |
| `WorkoutPlanDay` | Internal compatibility container; each plan has at most one, with no weekday meaning | Implemented |
| `WorkoutPlanExercise` | Library exercise, position, set count, repetition range, rest, and notes | Implemented |
| `WorkoutPlanSet` | Set number and its target repetitions and weight; row count matches the exercise's set count | Implemented |
| `WorkoutPlanShare` | Source plan and owner, hashed link token, fixed published version, expiry, and revocation time | Implemented |
| `WorkoutPlanImport` | Recipient, copied plan, and optional provenance reference to the shared version | Proposed |
| `WorkoutRun` | User, optional source-plan reference, plan-name snapshot, start/completion times, duration, and status | Implemented |
| `WorkoutExercise` | Exercise and position in a logged session, with a snapshot of its targets | Proposed |
| `WorkoutSet` | Set number, actual repetitions and weight, completion state, and completion time | Proposed |

Target and future actual weights must use separate fixed-precision columns.
Editing or deleting a plan does not change a completed run. Deleting a plan
preserves its run history by clearing the source-plan reference while retaining
the plan-name snapshot. Deleting a shared source does not delete recipients'
independent copies. Former multi-day grouping is preserved in
`WorkoutPlan.legacy_day_groups` during migration while exercises are flattened
into one ordered list.

## Authorization and Validation

- Only an owner can change their plans or workouts. Requests for another user's
  identifiers must be rejected without revealing whether those records exist.
- A plan can include an active common exercise or a private exercise owned by the
  same user. Deactivating an exercise must not erase past workout history.
- An imported plan belongs to the recipient from the moment it is added; the
  recipient can edit or delete it independently.
- Set counts, repetitions, and weights need reasonable bounds. Negative weight
  or repetitions are invalid, and implausible values must be rejected.
- Repeated start requests with the same client identifier must not create
  duplicate runs; only one run may be in progress per user.
- A completed run has a completion time and non-negative duration. Only
  completed runs appear in the run-history list.

## API Contract and Remaining Work

Implemented endpoints include `GET/POST /api/workout-plans`,
`GET/PATCH/DELETE /api/workout-plans/{plan_id}`, direct plan exercise routes,
`POST /api/workout-plans/{plan_id}/duplicate`, and plan activation and
deactivation. Plan responses include one top-level `exercises` list and primary
and secondary muscle coverage. Day-based API routes have been removed. Existing exercises were backfilled with one
target row per planned set.

Implemented additions:

- `PUT /api/workout-plans/{plan_id}/exercises/{item_id}/sets`
  replaces per-set targets in the plan's exercise list.
- `GET/POST /api/workout-plans/{plan_id}/shares` lists share status or creates
  an unguessable link to a fixed snapshot.
- `DELETE /api/workout-plans/{plan_id}/shares/{share_id}` revokes a link.
- `GET /api/workout-plans/shared/{token}` previews a valid shared snapshot.
- `POST /api/workout-plans/shared/{token}/import` creates an independent copy
  for the authenticated recipient.

Share-link creation rejects plans containing private or inactive exercises.
Import rechecks that referenced common exercises are still active. The raw link
token is returned only when created; the database stores its digest.

`POST /api/workouts` starts a run, `GET /api/workouts/active` restores it,
`POST /api/workouts/{id}/complete` records its date and duration, and
`GET /api/workouts` lists completed runs. `GET /api/workouts/{id}` and
`POST /api/workouts/{id}/cancel` are also available. Full offline synchronization,
actual-set logging, and exercise-performance charts remain future work.
