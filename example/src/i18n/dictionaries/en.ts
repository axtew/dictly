// The reference dictionary: its shape is the type of the dictionary in every component,
// and the other languages are checked against it.
export default {
  meta: {
    title: "dictly demo",
  },
  header: {
    tagline: "Typed i18n for TypeScript and React. The dictionary is a plain object.",
    language: "Language",
    slowNetwork: "Slow network",
    slowNetworkHint:
      "Adds 1.5 s to loading a language for the first time. The current text stays on screen meanwhile.",
    loading: "Loading: {:language}",
  },
  nav: {
    text: "Text",
    formatters: "Formatters",
    check: "Dictionary check",
  },
  text: {
    title: "Text and placeholders",
    intro:
      "A translation is property access. Placeholder names are typed from the string: a missing or misspelled parameter does not compile.",
    nameLabel: "Name",
    defaultName: "Anna",
    messagesLabel: "New messages",
    greeting: "Hello, {:name}! You have {:messages}.",
    messages: { one: "{:count} new message", other: "{:count} new messages" },
    pluralTitle: "Plural forms",
    pluralIntro:
      "The form is picked by Intl.PluralRules of the language. English and German need two forms, Russian needs four.",
    countLabel: "Count",
    category: "Form: {:category}",
    recipes: { one: "{:count} recipe", other: "{:count} recipes" },
    richTitle: "Elements inside text",
    richIntro:
      "format from dictly/react puts React elements into placeholders, so a sentence with a link stays one string in the dictionary.",
    rich: "Read the {:docs} or open an {:issue} on GitHub.",
    docs: "documentation",
    issue: "issue",
  },
  formatters: {
    title: "Intl formatters",
    intro:
      "useFormatters() returns Intl formatters for the language on screen. Instances are cached, so calling them during render is cheap.",
    columns: { what: "What", call: "Call", result: "Result" },
    number: "Number",
    currency: "Currency",
    percent: "Percent",
    date: "Date",
    time: "Time",
    relativePast: "Relative time, past",
    relativeFuture: "Relative time, future",
    list: "List",
    ingredients: { flour: "flour", sugar: "sugar", eggs: "eggs" },
  },
  check: {
    title: "Dictionary check",
    intro:
      "TypeScript checks dictionaries written as TS modules. JSON from a server has no types, so checkDictionaries compares it with the reference language at runtime: in a test, in CI or with the validate option of createI18n.",
    liveTitle: "Dictionaries of this demo",
    running: "Checking...",
    liveOk: "{:languages}: no problems.",
    liveIssues: { one: "{:count} problem found", other: "{:count} problems found" },
    brokenTitle: "A translation with mistakes",
    brokenIntro: "The same check on a small translation with typical mistakes:",
    reference: "Reference (en)",
    translation: "Translation (ru)",
    columns: { path: "Key", kind: "Problem", message: "Message" },
  },
  footer: {
    sources: "en and ru are TS modules loaded with import(), de is JSON fetched from {:path}.",
  },
} as const;
