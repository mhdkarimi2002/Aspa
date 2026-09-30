# Workout Plan Flow and Model

## Scope and Current Status

A workout plan is an editable prescription for a training routine. A workout is a
separate execution with a start time, duration, and actual results for each set.
Plan values are targets; they must never be shown as completed performance or
personal records.

The current API supports creating, editing, deleting, duplicating, and activating
plans; managing training days and exercises; configuring set counts, repetition
ranges, per-set target repetitions and weights, and rest periods; summarizing
muscle coverage; and creating, revoking, previewing, and importing fixed shared
versions. The user-facing sharing and per-set editing screens, timed workout
sessions, and performance history are not yet implemented.

## User Flows

### Create and Edit a Plan

1. The user enters a plan name and an optional description.
2. The user adds and orders one or more training days.
3. For each day, the user selects and orders exercises from the common library or
   their own private exercises.
4. For each exercise, the user sets the number of sets and each set's target
   repetitions and weight. Rest time and notes are optional.
5. The plan view shows the primary and secondary muscles targeted by its exercises.
6. The owner can edit, duplicate, archive, or delete the plan and manage its days
   and exercises.

The set count must match the number of target-set rows. Increasing the count may
copy suggested values from the last set, but each new set remains editable.
Reducing the count requires confirmation before extra rows are removed. Weight is
stored in kilograms using a fixed-precision numeric type. Zero is valid for an
unweighted movement; a missing value means that no weight target was set.
Repetitions must be positive integers. An empty plan may remain a draft, but a
workout cannot start until the selected day contains at least one valid exercise.

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

### Start and Log a Workout

1. The user selects a training day from one of their plans and presses Start.
2. The start time is saved and a duration timer begins. Leaving the screen or
   backgrounding the app does not restart the timer.
3. The day's exercises and set targets are copied into a separate workout
   session. For each set, the user enters actual repetitions and weight, then
   marks it complete. The user may add or remove sets during the session.
4. Editing the source plan during a workout does not alter the running session.
5. Finishing the workout saves its end time and duration. Only completed sets
   from finished workouts contribute to history, charts, and records.
6. Cancelling a workout excludes it from performance history and records. The
   source plan remains unchanged in either case.

Only one workout may be in progress per user. Reopening the app must restore that
session and its original start time. The mobile client should save session changes
locally before syncing them with stable client identifiers, so network loss or
retries cannot lose or duplicate sets. Duration is calculated from valid start
and end timestamps, not from the on-screen timer alone.

### View History and Progress

Users can review finished workouts, logged sets for each exercise, and personal
records. Future charts must use these actual completed sets. Plan targets,
unfinished sets, cancelled sessions, and other users' data never contribute to
records or charts. Weight and volume record calculations are described in the
[exercise flow and model](exercise-flow-and-model.md).

## Data Model

| Entity | Purpose and key data | Status |
| --- | --- | --- |
| `WorkoutPlan` | Owner, name, description, active/archive state, creation and update times | Implemented |
| `WorkoutPlanDay` | A day within a plan, with a name and position | Implemented |
| `WorkoutPlanExercise` | Library exercise, position, set count, repetition range, rest, and notes | Implemented |
| `WorkoutPlanSet` | Set number and its target repetitions and weight; row count matches the exercise's set count | Implemented |
| `WorkoutPlanShare` | Source plan and owner, hashed link token, fixed published version, expiry, and revocation time | Implemented |
| `WorkoutPlanImport` | Recipient, copied plan, and optional provenance reference to the shared version | Proposed |
| `Workout` | User, source day and plan, start and end times, duration, and status | Proposed |
| `WorkoutExercise` | Exercise and position in a logged session, with a snapshot of its targets | Proposed |
| `WorkoutSet` | Set number, actual repetitions and weight, completion state, and completion time | Proposed |

Target and actual weights must use separate fixed-precision columns. Editing or
deleting a source plan must not change a finished workout. Deleting a plan must
preserve workout history, with the source reference made optional or retained as
historical metadata. Deleting a shared source must not delete recipients'
independent copies. Final column names and migrations will be decided during
implementation.

## Authorization and Validation

- Only an owner can change their plans or workouts. Requests for another user's
  identifiers must be rejected without revealing whether those records exist.
- A plan can include an active common exercise or a private exercise owned by the
  same user. Deactivating an exercise must not erase past workout history.
- An imported plan belongs to the recipient from the moment it is added; the
  recipient can edit or delete it independently.
- Set counts, repetitions, and weights need reasonable bounds. Negative weight
  or repetitions are invalid, and implausible values must be rejected.
- Repeated start or sync requests for an in-progress workout must not create
  duplicate sessions or sets.
- The end time must follow the start time. Records are calculated only from
  completed sets in finished sessions.

## API Contract and Remaining Work

Implemented endpoints include `GET/POST /api/workout-plans`,
`GET/PATCH/DELETE /api/workout-plans/{plan_id}`, the nested day and exercise
routes, `POST /api/workout-plans/{plan_id}/duplicate`, and plan activation and
deactivation. Plan responses include primary and secondary muscle coverage. The
current model also returns `target_sets` for every exercise. Existing exercises
were backfilled with one target row per planned set.

Implemented additions:

- `PUT /api/workout-plans/{plan_id}/days/{day_id}/exercises/{item_id}/sets`
  replaces individual set targets.
- `GET/POST /api/workout-plans/{plan_id}/shares` lists share status or creates
  an unguessable link to a fixed snapshot.
- `DELETE /api/workout-plans/{plan_id}/shares/{share_id}` revokes a link.
- `GET /api/workout-plans/shared/{token}` previews a valid shared snapshot.
- `POST /api/workout-plans/shared/{token}/import` creates an independent copy
  for the authenticated recipient.

Share-link creation rejects plans containing private or inactive exercises.
Import rechecks that referenced common exercises are still active. The raw link
token is returned only when created; the database stores its digest.

The remaining backend work belongs to live workout tracking: starting, updating,
finishing, and viewing sessions. Workout models, actual-set history, timer
restoration, and duplicate-free synchronization are not implemented yet.
