"use client";

import Header from "@/components/shared/header";
import { getApiErrorMessage } from "@/shared/api/error";
import { useGetExercises } from "../api/exercies-query";
import ExerciseListSkeleton from "./exercies-loading";
import ExerciseError from "./exercies-error";
import ExerciseEmpty from "./exercies-empty";

const ExercisesScreen = () => {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetExercises();
  const items = data?.items ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">حرکت‌ها</p>
          <h1 className="text-3xl font-semibold">تمرین‌ها</h1>
        </div>

        {isLoading ? <ExerciseListSkeleton /> : null}

        {isError ? (
          <ExerciseError
            message={getApiErrorMessage(error)}
            pending={isFetching}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <ExerciseEmpty />
        ) : null}

        {!isLoading && !isError && items.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h2 className="text-base font-medium">{item.name_fa}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.name_en}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
};

export default ExercisesScreen;
