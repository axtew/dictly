import type { Translation } from "../../..";
import type en from "./en";

export default {
  title: "Рецепты",
  count: "{:count} из {:total}",
  recipes: {
    one: "{:count} рецепт",
    few: "{:count} рецепта",
    many: "{:count} рецептов",
    other: "{:count} рецепта",
  },
  default: { label: "Раздел с именем default" },
} as const satisfies Translation<typeof en>;
