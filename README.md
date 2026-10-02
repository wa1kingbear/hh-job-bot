# HH Job Monitor Bot

Персональный бот для поиска удалённых Senior/Lead React-вакансий через официальный HH API и доставки релевантных результатов в Telegram.

## Требования

- Node.js 22+
- npm 10+

## Запуск разработки

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Проверка API:

```bash
curl http://127.0.0.1:3000/health
```

## Проверки

```bash
npm run typecheck
npm test
npm run build
```

## Текущее состояние

- создана SQLite-схема и первая миграция;
- реализован типизированный HH API client с retry для `429` и `5xx`;
- реализован агрегатор поисковых профилей с дедупликацией;
- формализованы hard filters и расчёт Freshness, Competition и Priority Score;
- Vue как основной стек отклоняется;
- React Native как основной стек получает штраф `-10`.

OAuth, Telegram-уведомления, scheduler и LLM-анализ будут подключаться следующими этапами.
