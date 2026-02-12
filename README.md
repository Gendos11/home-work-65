# Express + Passport + MongoDB Atlas

Сервер на `Node.js + Express.js` з локальною авторизацією через `Passport` та інтеграцією з `MongoDB Atlas`.

## Нова функціональність (HW-65)

- Підключення до `MongoDB Atlas` через `Mongoose`
- Збереження користувачів у колекції `users` (замість in-memory сховища)
- Операція читання даних з MongoDB:
  - `GET /users` - повертає список користувачів у JSON
  - `GET /users/page` - відображає список користувачів на HTML-сторінці сервера

## Основні можливості

- Реєстрація: `POST /auth/register`
- Вхід: `POST /auth/login`
- Вихід: `POST /auth/logout`
- Перевірка поточного користувача: `GET /auth/me`
- Захищений маршрут: `GET /protected`
- Читання даних з MongoDB (тільки для авторизованого користувача): `GET /users`, `GET /users/page`

## Технології

- Node.js
- Express.js
- Passport.js (`passport-local`)
- express-session
- MongoDB Atlas
- Mongoose
- bcryptjs
- dotenv

## Встановлення

1. Встановіть залежності:

```bash
npm install
```

2. Створіть `.env`:

```bash
cp .env.example .env
```

3. Заповніть змінні середовища у `.env`:

```env
PORT=3000
SESSION_SECRET=please_change_me
COOKIE_SECURE=false
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority
MONGODB_DB=
```

`MONGODB_DB` можна лишити порожнім, якщо назва БД вже вказана в `MONGODB_URI`.

4. Запустіть сервер:

```bash
npm run dev
```

або

```bash
npm start
```

## Налаштування MongoDB Atlas

1. Створіть кластер у MongoDB Atlas.
2. Створіть користувача БД (Database Access).
3. Додайте IP у `Network Access` (для розробки можна дозволити поточний IP).
4. Візьміть `Connection string` (Driver: Node.js) і вставте в `MONGODB_URI`.

## Маршрут читання даних

### `GET /users`

Повертає список користувачів з колекції `users`.

Приклад відповіді:

```json
{
  "total": 2,
  "users": [
    {
      "id": "67ab0f7e4d8a2a0f34c7f7c0",
      "email": "user@example.com",
      "createdAt": "2026-02-12T13:45:10.901Z"
    }
  ]
}
```

### `GET /users/page`

Відображає ті самі дані на HTML-сторінці, згенерованій сервером.

## Примітки

- Маршрути `/users` і `/users/page` захищені middleware `requireAuth`.
- Для доступу спочатку виконайте `POST /auth/login` або `POST /auth/register`.
- Cookie-сесія використовується для автентифікації запитів.
