/** A small reference dictionary and a translation with the mistakes `checkDictionaries` finds. */
export const reference = {
  title: "Recipes",
  greeting: "Hello, {:name}!",
  recipes: { one: "{:count} recipe", other: "{:count} recipes" },
  actions: { save: "Save", delete: "Delete" },
};

export const translation = {
  title: "",
  greeting: "Привет, {:nmae}!",
  recipes: { one: "{:count} рецепт", other: "{:count} рецепта" },
  actions: { save: "Сохранить" },
  footer: "Подвал",
};
