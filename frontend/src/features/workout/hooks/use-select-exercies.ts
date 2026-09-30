import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  useGetExercises,
  useGetMuscleGroups,
} from "@/features/exercises/api/exercies-query";
import type { Exercise } from "@/features/exercises/api/exercies-type";
import { getApiErrorMessage } from "@/shared/api/error";
import { useThemeStore } from "@/stores/theme.store";
import type { AddExercieseSchema } from "../schema";

const difficultyLabel: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export interface MuscleOption {
  id: string;
  label: string;
  selected: boolean;
}

export interface ExerciseOption {
  id: string;
  title: string;
  subtitle: string;
  difficulty: string;
  selected: boolean;
}

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => void }
  | { status: "ready"; items: T[] };

export type MusclePanelState = LoadState<MuscleOption>;

export type ExercisePanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => void }
  | { status: "empty" }
  | { status: "ready"; items: ExerciseOption[] };

function labelFor(
  language: string,
  item: { name_fa: string; name_en: string },
) {
  return language === "fa" ? item.name_fa : item.name_en;
}

function toMusclePanel(
  language: string,
  muscleId: string | null,
  query: ReturnType<typeof useGetMuscleGroups>,
): MusclePanelState {
  if (query.isLoading) return { status: "loading" };
  if (query.isError) {
    return {
      status: "error",
      message: getApiErrorMessage(query.error),
      onRetry: () => void query.refetch(),
    };
  }

  return {
    status: "ready",
    items: (query.data ?? []).map((item) => ({
      id: item.id,
      label: labelFor(language, item),
      selected: item.id === muscleId,
    })),
  };
}

function toExerciseOption(
  exercise: Exercise,
  language: string,
  exerciseId: string,
): ExerciseOption {
  const title = labelFor(language, exercise);
  const subtitle = language === "fa" ? exercise.name_en : exercise.name_fa;

  return {
    id: exercise.id,
    title,
    subtitle,
    difficulty: difficultyLabel[exercise.difficulty] ?? exercise.difficulty,
    selected: exercise.id === exerciseId,
  };
}

function toExercisePanel(
  language: string,
  muscleId: string | null,
  exerciseId: string,
  query: ReturnType<typeof useGetExercises>,
): ExercisePanelState {
  if (!muscleId) return { status: "idle" };
  if (query.isLoading) return { status: "loading" };
  if (query.isError) {
    return {
      status: "error",
      message: getApiErrorMessage(query.error),
      onRetry: () => void query.refetch(),
    };
  }

  const items = query.data?.items ?? [];
  if (items.length === 0) return { status: "empty" };

  return {
    status: "ready",
    items: items.map((exercise) =>
      toExerciseOption(exercise, language, exerciseId),
    ),
  };
}

export function useSelectExercies(onContinue: (name: string) => void) {
  const { control, setValue } = useFormContext<AddExercieseSchema>();
  const exerciseId = useWatch({ control, name: "exercise_id" });
  const language = useThemeStore((state) => state.language);
  const [muscleId, setMuscleId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Exercise | null>(null);
  const musclesQuery = useGetMuscleGroups();
  const exercisesQuery = useGetExercises(muscleId ?? undefined);

  function selectMuscle(id: string) {
    setMuscleId(id);
    setPicked(null);
    setValue("exercise_id", "", { shouldDirty: true, shouldValidate: true });
  }

  function selectExercise(id: string) {
    const exercise = exercisesQuery.data?.items.find((item) => item.id === id);
    if (!exercise) return;

    setPicked(exercise);
    setValue("exercise_id", exercise.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function confirmPick() {
    if (!picked) return;
    onContinue(labelFor(language, picked));
  }

  return {
    muscles: toMusclePanel(language, muscleId, musclesQuery),
    exercises: toExercisePanel(
      language,
      muscleId,
      exerciseId,
      exercisesQuery,
    ),
    selectMuscle,
    selectExercise,
    pickedName: picked ? labelFor(language, picked) : null,
    canContinue: Boolean(exerciseId),
    onContinue: confirmPick,
  };
}
