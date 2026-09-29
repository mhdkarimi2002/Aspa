"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  muscles: ReactNode;
  equipment: ReactNode;
  musclesLabel: string;
  equipmentLabel: string;
}

const ExerciseTabs = ({
  muscles,
  equipment,
  musclesLabel,
  equipmentLabel,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "equipment" ? "equipment" : "muscles";

  function onValueChange(value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "equipment") next.set("tab", "equipment");
    else next.delete("tab");
    const query = next.toString();
    router.push(query ? `/exercises?${query}` : "/exercises", { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={onValueChange}>
      <TabsList className="h-11">
        <TabsTrigger value="muscles" className="h-11 px-4">
          {musclesLabel}
        </TabsTrigger>
        <TabsTrigger value="equipment" className="h-11 px-4">
          {equipmentLabel}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="muscles" keepMounted className="flex flex-col gap-6">
        {muscles}
      </TabsContent>
      <TabsContent value="equipment" keepMounted className="flex flex-col gap-6">
        {equipment}
      </TabsContent>
    </Tabs>
  );
};

export default ExerciseTabs;
