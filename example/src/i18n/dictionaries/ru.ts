import type { Translation } from "dictly";

import type en from "./en";

export default {
  meta: {
    title: "Демо dictly",
  },
  header: {
    tagline: "Типизированная i18n для TypeScript и React. Словарь - обычный объект.",
    language: "Язык",
    slowNetwork: "Медленная сеть",
    slowNetworkHint:
      "Добавляет 1,5 с к первой загрузке языка. Пока он грузится, на экране остаётся текущий текст.",
    loading: "Загружается: {:language}",
  },
  nav: {
    text: "Текст",
    formatters: "Форматирование",
    check: "Проверка словарей",
  },
  text: {
    title: "Текст и параметры",
    intro:
      "Перевод - это обращение к свойству. Имена параметров типизированы по строке: без параметра или с опечаткой в имени код не скомпилируется.",
    nameLabel: "Имя",
    defaultName: "Анна",
    messagesLabel: "Новых сообщений",
    greeting: "Привет, {:name}! У вас {:messages}.",
    messages: {
      one: "{:count} новое сообщение",
      few: "{:count} новых сообщения",
      many: "{:count} новых сообщений",
      other: "{:count} нового сообщения",
    },
    pluralTitle: "Множественное число",
    pluralIntro:
      "Форму выбирает Intl.PluralRules языка. Английскому и немецкому нужны две формы, русскому четыре.",
    countLabel: "Количество",
    category: "Форма: {:category}",
    recipes: {
      one: "{:count} рецепт",
      few: "{:count} рецепта",
      many: "{:count} рецептов",
      other: "{:count} рецепта",
    },
    richTitle: "Элементы внутри текста",
    richIntro:
      "format из dictly/react подставляет React-элементы в параметры, поэтому фраза со ссылкой остаётся в словаре одной строкой.",
    rich: "Загляните в {:docs} или создайте {:issue} на GitHub.",
    docs: "документацию",
    issue: "issue",
  },
  formatters: {
    title: "Форматирование через Intl",
    intro:
      "useFormatters() возвращает форматтеры Intl для языка на экране. Экземпляры кэшируются, так что вызывать их при рендере дёшево.",
    columns: { what: "Что", call: "Вызов", result: "Результат" },
    number: "Число",
    currency: "Валюта",
    percent: "Проценты",
    date: "Дата",
    time: "Время",
    relativePast: "Относительное время, прошлое",
    relativeFuture: "Относительное время, будущее",
    list: "Список",
    ingredients: { flour: "мука", sugar: "сахар", eggs: "яйца" },
  },
  check: {
    title: "Проверка словарей",
    intro:
      "Словари в виде TS-модулей проверяет TypeScript. У JSON с сервера типов нет, поэтому checkDictionaries сравнивает его с эталонным языком во время работы: в тесте, в CI или через опцию validate в createI18n.",
    liveTitle: "Словари этого демо",
    running: "Проверяю...",
    liveOk: "{:languages}: проблем нет.",
    liveIssues: {
      one: "Найдена {:count} проблема",
      few: "Найдено {:count} проблемы",
      many: "Найдено {:count} проблем",
      other: "Найдено {:count} проблемы",
    },
    brokenTitle: "Перевод с ошибками",
    brokenIntro: "Та же проверка на маленьком переводе с типичными ошибками:",
    reference: "Эталон (en)",
    translation: "Перевод (ru)",
    columns: { path: "Ключ", kind: "Проблема", message: "Сообщение" },
  },
  footer: {
    sources: "en и ru - TS-модули, загружаются через import(), de - JSON, загружается с {:path}.",
  },
} as const satisfies Translation<typeof en>;
