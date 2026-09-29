import Link from "next/link";
import { Check } from "lucide-react";
import { getApiErrorMessage } from "@/shared/api/error";
import { getMusleGroupServer } from "../api/exercies-server";
import MuscleGroupError from "./muscle-group-error";

interface Props {
  selectedId?: string;
}

const chipClassName = (selected: boolean) =>
  [
    "inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-200 motion-reduce:transition-none focus-visible:ring-3 focus-visible:ring-ring",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:bg-muted",
  ].join(" ");

const MuscleGroupList = async ({ selectedId }: Props) => {
  const { isError, error, data } = await getMusleGroupServer();
  const muscleGroups = data ?? [];

  if (isError) {
    return <MuscleGroupError message={getApiErrorMessage(error)} />;
  }

  if (muscleGroups.length === 0) {
    return (
      <section aria-labelledby="muscle-groups-heading">
        <h2 id="muscle-groups-heading" className="text-sm font-medium">
          گروه عضلانی
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          هنوز گروه عضلانی ثبت نشده.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="muscle-groups-heading"
      className="flex flex-col gap-3"
    >
      <h2 id="muscle-groups-heading" className="text-sm font-medium">
        گروه عضلانی
      </h2>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max flex-nowrap gap-2 md:w-auto md:flex-wrap">
        <li className="shrink-0">
          <Link
            href="/exercises"
            scroll={false}
            aria-current={selectedId ? undefined : "page"}
            className={chipClassName(!selectedId)}
          >
            {!selectedId ? (
              <Check className="size-4" aria-hidden="true" />
            ) : null}
            همه
          </Link>
        </li>
        {muscleGroups.map((muscleGroup) => {
          const selected = selectedId === muscleGroup.id;

          return (
            <li key={muscleGroup.id} className="shrink-0">
              <Link
                href={`/exercises?muscle=${muscleGroup.id}`}
                scroll={false}
                aria-current={selected ? "page" : undefined}
                className={chipClassName(selected)}
              >
                {selected ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
                {muscleGroup.name_fa}
              </Link>
            </li>
          );
        })}
        </ul>
      </div>
    </section>
  );
};

export default MuscleGroupList;
