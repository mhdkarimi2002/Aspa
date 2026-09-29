import Link from "next/link";
import { Check } from "lucide-react";
import { getApiErrorMessage } from "@/shared/api/error";
import { getEquipmentServer } from "../api/exercies-server";
import { getLocale } from "@/shared/i18n/get-locale";
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

const EquipmentList = async ({ selectedId }: Props) => {
  const { isError, error, data } = await getEquipmentServer();
  const equipment = data ?? [];
  const language = await getLocale();

  if (isError) {
    return <MuscleGroupError message={getApiErrorMessage(error)} />;
  }

  if (equipment.length === 0) {
    return (
      <section aria-labelledby="equipment-heading">
        <h2 id="equipment-heading" className="text-sm font-medium">
          تجهیزات
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          هنوز تجهیزاتی ثبت نشده.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="equipment-heading" className="flex flex-col gap-3">
      <h2 id="equipment-heading" className="text-sm font-medium">
        تجهیزات
      </h2>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max flex-nowrap gap-2 md:w-auto md:flex-wrap">
          <li className="shrink-0">
            <Link
              href="/exercises?tab=equipment"
              scroll={false}
              aria-current={selectedId ? undefined : "page"}
              className={chipClassName(!selectedId)}
            >
              {!selectedId ? (
                <Check className="size-4" aria-hidden="true" />
              ) : null}
              {language === "fa" ? "همه" : "All"}
            </Link>
          </li>
          {equipment.map((item) => {
            const selected = selectedId === item.id;

            return (
              <li key={item.id} className="shrink-0">
                <Link
                  href={`/exercises?tab=equipment&equipment=${item.id}`}
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  className={chipClassName(selected)}
                >
                  {selected ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : null}
                  {language === "fa" ? item.name_fa : item.name_en}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default EquipmentList;
