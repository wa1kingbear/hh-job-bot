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
