"use client";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  message: string;
}

const MuscleGroupError = ({ message }: Props) => {
  const router = useRouter();
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <TriangleAlert className="size-5 shrink-0 text-destructive" aria-hidden="true" />
      <p className="text-sm">{message}</p>
      <Button variant="outline" className="h-11" onClick={() => router.refresh()}>
        تلاش دوباره
      </Button>
    </div>
  );
};

export default MuscleGroupError;
