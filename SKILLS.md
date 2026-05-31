# Pansion CRM — Ключевые знания по проекту

## Структура проекта
```
/root/pansion/
├── backend/          # Go API (chi router, pgx, gorilla/websocket)
│   ├── cmd/server/main.go  # Точка входа, маршруты, handlers
│   ├── db/seed.sql   # Демо-данные
│   └── internal/     # Репозитории, middleware, services
├── web-react/        # React+TypeScript frontend (CRA + Tailwind CSS 3.x)
│   ├── src/
│   │   ├── App.tsx   # Главный компонент с TabBar и навигацией
│   │   ├── LangContext.tsx  # Локализация RU/EN (RL(), TL() функции)
│   │   ├── AuthContext.tsx  # Авторизация (localStorage: pansion_token, pansion_user)
│   │   ├── api.ts    # API клиент (Bearer token автоматически)
│   │   ├── types.ts  # TypeScript интерфейсы
│   │   └── components/
│   │       ├── pages/        # Все страницы
│   │       ├── RolesOverlay.tsx
│   │       └── SettingsOverlay.tsx
│   └── tailwind.config.js
├── web/public/index.html  # Старый HTML фронтенд (для совместимости)
└── restart.sh        # Перезапуск бэкенда (go build + systemctl restart)
```

## API Endpoints
- `POST /api/v1/auth/login` — авторизация
- `GET /api/v1/dashboard` — статистика (inline JWT auth)
- `GET/PUT/POST/DELETE /api/v1/users` — CRUD сотрудников
- `GET /api/v1/guests` — постояльцы (JOIN с rooms для room_number)
- `GET /api/v1/rooms/chessboard` — номерной фонд
- `PUT /api/v1/rooms/{id}/status` — обновление статуса комнаты
- `GET /api/v1/maid/tasks` — задачи горничных
- `POST /api/v1/maid/tasks/complete` — отметить задачу выполненной
- `GET /api/v1/finance`, `/api/v1/finance/summary`, `/api/v1/finance/categories` — финансы
- `GET /api/v1/medical/prescriptions`, `/api/v1/medical/logs`, `POST /medical/logs/toggle` — медицина
- `GET/POST/DELETE /api/v1/settings/roles` — управление ролями
- `GET/POST /api/v1/settings/tabs` — настройка видимости вкладок
- `GET /api/v1/ws?token=***` — WebSocket (auth через query param)

## Критические особенности

### Nginx
- `proxy_set_header Authorization $http_authorization` — ОБЯЗАТЕЛЬНО для передачи токена в бэкенд
- `/pansion-react/` — React фронтенд
- `/pansion/` — старый HTML фронтенд
- `/api/v1/` — прокси на 127.0.0.1:8080

### Авторизация
- Токен сохраняется в localStorage (`pansion_token`)
- Dashboard и некоторые endpoints используют inline JWT auth (читают Authorization заголовок напрямую)
- НЕ использовать `$http_authorization` в nginx — может быть пустым. Лучше всегда передавать: `proxy_set_header Authorization $http_authorization;`

### Данные
- Таблицы `guests` и `maid_tasks` имеют колонку `pension_id` (добавлена миграцией)
- Seed: `guests.pension_id` должен быть задан явно
- `maid_tasks` создаются через PL/pgSQL блок с `fid` переменной — использовать `(SELECT id FROM pensions LIMIT 1)` вместо `fid`

### Frontend
- `RL('key')` — перевод общих строк (из LangContext.CommonStrings)
- `TL('key')` — перевод вкладок (из LangContext.TabStrings)
- API возвращает поля с большой 字母: `{Table: "rooms", Count: 30}` — использовать `s.Table || s.table`
- `data.sos_active > 0 && (...)` — React не рендерит 0, но рендерит "0" текст. Использовать строгое сравнение.

### PostgreSQL
- Команда: `sudo -u postgres psql -d pansion -f seed.sql`
- Очистка: `DELETE FROM maid_tasks; DELETE FROM guests; DELETE FROM ...`

### Запуск
- Backend: `cd backend && go build -o /usr/local/bin/pansion ./cmd/server/ && systemctl restart pansion`
- Frontend: `cd web-react && PUBLIC_URL=/pansion-react npm run build && cp -r build/* /var/www/lavender/pansion-react/`
- Nginx: `nginx -t && systemctl reload nginx`

### Баги и исправления
- `guests.room_id` должен быть задан через subquery: `(SELECT id FROM rooms WHERE number='101' LIMIT 1)`
- `maid_tasks.pension_id` в seed: использовать `(SELECT id FROM pensions LIMIT 1)` вместо `fid`
- `medication_logs` seed: убрать `interval 'minute'` — синтаксическая ошибка в pgx
