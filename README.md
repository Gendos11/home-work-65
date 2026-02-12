# Express + Passport + MongoDB Atlas

Сервер на `Node.js + Express.js` з автентифікацією через `Passport` та роботою з `MongoDB Atlas`.

## Що реалізовано в цьому HW

На базі існуючого читання даних додано повний CRUD для колекції `users`:

- створення: `insertOne`, `insertMany`
- читання: `find` + `projection`
- оновлення: `updateOne`, `updateMany`, `replaceOne`
- видалення: `deleteOne`, `deleteMany`

Усі маршрути реалізовані у файлі `src/routes/users.js` і використовують функції з `src/data/userStore.js`, де викликаються відповідні MongoDB-операції через `User.collection.*`.

## Технології

- Node.js
- Express.js
- Passport.js (`passport-local`)
- express-session
- MongoDB Atlas
- Mongoose
- bcryptjs
- dotenv

## Встановлення та запуск

1. Встановіть залежності:

```bash
npm install
```

2. Створіть `.env`:

```bash
cp .env.example .env
```

3. Заповніть змінні середовища:

```env
PORT=3000
SESSION_SECRET=please_change_me
COOKIE_SECURE=false
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority
MONGODB_DB=
```

4. Запустіть сервер:

```bash
npm run dev
```

## Авторизація перед CRUD

Маршрути `/users/*` захищені middleware `requireAuth` (`src/middleware/requireAuth.js`), тому спочатку потрібно увійти.

Приклад:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

Далі для всіх запитів до `/users/*` використовуйте `-b cookies.txt`.

## Маршрути CRUD для MongoDB

### 1) Читання (`find` + `projection`)

`GET /users`

Підтримує query-параметри:

- `filter` (JSON-об'єкт)
- `projection` (JSON-об'єкт)
- `sort` (JSON-об'єкт)
- `limit` (число, за замовчуванням `50`, максимум `100`)
- `skip` (число, за замовчуванням `0`)

Приклад:

```bash
curl -s -b cookies.txt "http://localhost:3000/users?filter=%7B%22email%22%3A%7B%22%24regex%22%3A%22example.com%24%22%7D%7D&projection=%7B%22email%22%3A1%2C%22createdAt%22%3A1%2C%22_id%22%3A0%7D&sort=%7B%22createdAt%22%3A-1%7D&limit=10&skip=0"
```

Очікувана відповідь:

```json
{
  "total": 1,
  "users": [
    {
      "email": "user@example.com",
      "createdAt": "2026-02-12T13:45:10.901Z"
    }
  ]
}
```

### 2) Створення одного документа (`insertOne`)

`POST /users/insert-one`

```bash
curl -s -b cookies.txt -X POST http://localhost:3000/users/insert-one \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "email": "insert.one@example.com",
      "passwordHash": "$2b$12$examplehashvalue"
    }
  }'
```

Очікувана відповідь:

```json
{
  "message": "insertOne completed.",
  "acknowledged": true,
  "insertedId": "67ace7c96d1bcbf6b9a9f111"
}
```

### 3) Створення багатьох документів (`insertMany`)

`POST /users/insert-many`

```bash
curl -s -b cookies.txt -X POST http://localhost:3000/users/insert-many \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      { "email": "many.1@example.com", "passwordHash": "hash_1" },
      { "email": "many.2@example.com", "passwordHash": "hash_2" }
    ]
  }'
```

Очікувана відповідь:

```json
{
  "message": "insertMany completed.",
  "acknowledged": true,
  "insertedCount": 2,
  "insertedIds": [
    "67ace7c96d1bcbf6b9a9f112",
    "67ace7c96d1bcbf6b9a9f113"
  ]
}
```

### 4) Оновлення одного документа (`updateOne`)

`PATCH /users/update-one`

```bash
curl -s -b cookies.txt -X PATCH http://localhost:3000/users/update-one \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "email": "many.1@example.com" },
    "update": { "$set": { "email": "many.1.updated@example.com" } },
    "upsert": false
  }'
```

Очікувана відповідь:

```json
{
  "message": "updateOne completed.",
  "acknowledged": true,
  "matchedCount": 1,
  "modifiedCount": 1,
  "upsertedId": null
}
```

### 5) Оновлення багатьох документів (`updateMany`)

`PATCH /users/update-many`

```bash
curl -s -b cookies.txt -X PATCH http://localhost:3000/users/update-many \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "email": { "$regex": "many\\." } },
    "update": { "$set": { "role": "student" } },
    "upsert": false
  }'
```

Очікувана відповідь:

```json
{
  "message": "updateMany completed.",
  "acknowledged": true,
  "matchedCount": 2,
  "modifiedCount": 2,
  "upsertedId": null
}
```

### 6) Заміна одного документа (`replaceOne`)

`PUT /users/replace-one`

```bash
curl -s -b cookies.txt -X PUT http://localhost:3000/users/replace-one \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "email": "many.2@example.com" },
    "replacement": {
      "email": "many.2.replaced@example.com",
      "passwordHash": "new_hash"
    },
    "upsert": false
  }'
```

Очікувана відповідь:

```json
{
  "message": "replaceOne completed.",
  "acknowledged": true,
  "matchedCount": 1,
  "modifiedCount": 1,
  "upsertedId": null
}
```

### 7) Видалення одного документа (`deleteOne`)

`DELETE /users/delete-one`

```bash
curl -s -b cookies.txt -X DELETE http://localhost:3000/users/delete-one \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "email": "insert.one@example.com" }
  }'
```

Очікувана відповідь:

```json
{
  "message": "deleteOne completed.",
  "acknowledged": true,
  "deletedCount": 1
}
```

### 8) Видалення багатьох документів (`deleteMany`)

`DELETE /users/delete-many`

```bash
curl -s -b cookies.txt -X DELETE http://localhost:3000/users/delete-many \
  -H "Content-Type: application/json" \
  -d '{
    "filter": { "email": { "$regex": "many\\." } }
  }'
```

Очікувана відповідь:

```json
{
  "message": "deleteMany completed.",
  "acknowledged": true,
  "deletedCount": 2
}
```

## Де саме реалізовані методи MongoDB

- `insertOne` -> `insertOneUser()` у `src/data/userStore.js`, маршрут `POST /users/insert-one` у `src/routes/users.js`
- `insertMany` -> `insertManyUsers()` у `src/data/userStore.js`, маршрут `POST /users/insert-many` у `src/routes/users.js`
- `find` + `projection` -> `findUsers()` у `src/data/userStore.js`, маршрут `GET /users` у `src/routes/users.js`
- `updateOne` -> `updateOneUser()` у `src/data/userStore.js`, маршрут `PATCH /users/update-one` у `src/routes/users.js`
- `updateMany` -> `updateManyUsers()` у `src/data/userStore.js`, маршрут `PATCH /users/update-many` у `src/routes/users.js`
- `replaceOne` -> `replaceOneUser()` у `src/data/userStore.js`, маршрут `PUT /users/replace-one` у `src/routes/users.js`
- `deleteOne` -> `deleteOneUser()` у `src/data/userStore.js`, маршрут `DELETE /users/delete-one` у `src/routes/users.js`
- `deleteMany` -> `deleteManyUsers()` у `src/data/userStore.js`, маршрут `DELETE /users/delete-many` у `src/routes/users.js`

## Додатково

- `GET /users/page` лишився доступним і відображає дані з MongoDB у HTML.
- Для фільтру за id можна передавати `id` або `_id` у `filter`. Якщо це валідний ObjectId, він автоматично конвертується.
