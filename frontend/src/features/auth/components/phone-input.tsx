import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PhoneInput = ({
  field,
  fieldState,
}: {
  field: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
  };
  fieldState: { invalid: boolean; error?: { message?: string } };
}) => (
  <>
    <label htmlFor={field.name} className="text-sm font-medium">
      شماره موبایل
    </label>
    <Input
      id={field.name}
      name={field.name}
      value={field.value}
      onBlur={field.onBlur}
      onChange={(event) => field.onChange(event.target.value)}
      type="tel"
      autoComplete="tel"
      inputMode="tel"
      dir="ltr"
      aria-invalid={fieldState.invalid || undefined}
      className={cn("text-end", fieldState.error && "border-destructive")}
    />
    {fieldState.error ? (
      <FieldError>{fieldState.error.message}</FieldError>
    ) : (
      <p className="text-xs leading-normal text-muted-foreground">
        مثال: 09123456789
      </p>
    )}
  </>
);

export default PhoneInput;
