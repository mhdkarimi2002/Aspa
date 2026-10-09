import { digits } from "../auth/schemas";
export function inputNumber(value: string) {
  return Number(digits(value).replaceAll("٫", "."));
}
