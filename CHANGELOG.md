# Changelog

## [v0.9.3] - 2026-05-31

### Исправления
- **Финансы**: переведены все лейблы на RU/EN (Доход, Расход, Баланс)
- **Дашборд**: переведены секции "Статус номеров" и "Финансовый итог"
- **Медицина**: переведены "Назначения" и "Журнал на сегодня"
- **Постояльцы**: добавлен перевод "Диета" (Diet Type)
- **Добавлен визуальный bar chart для финансов** (доходы/расходы)

## [v0.9.2] - 2026-05-31

### Исправления
- **TasksPage**: переписан с Tailwind CSS корректно

## [v0.9.1] - 2026-05-31

### Новое
- **Медицина**: 3 API endpoint'а (prescriptions, logs, toggle), UI с назначениями и журналом
- **Demo данные**: 8 медицинских назначений, 8 логов приёма

### Исправления
- **Backend**: исправлены SQL запросы medical (убран pension_id filter)
- **Backend**: добавлен PUT /api/v1/rooms/{id}/status
- **Frontend**: ChessboardPage переписан под формат ответа API
- **Frontend**: DashboardPage stats парсинг (array format)
- **Frontend**: UsersPage delete confirmation (кастомный модал)

## [v0.9.0] - 2026-05-31

### Новое
- **React+TypeScript frontend** создан в `/root/pansion/web-react/`
- CRA + TypeScript + Tailwind CSS 3.x
- Все страницы: Login, Dashboard, Chessboard, Tasks, Guests, Finance, Medical, SOS, Users
- Settings overlay (tab visibility per role)
- Roles overlay (CRUD)
- Auth context с localStorage
- Lang context (RU/EN) с полными переводами
- API клиент с Bearer токеном

## [v0.8.0] - 2026-05-31

### Новое
- **Медицина**: 3 API endpoint'а, UI с назначениями и журналом
- **Demo данные**: 8 назначений, 8 логов, гости привязаны к комнатам

### Исправления
- Роли появляются в select после создания/удаления
- Settings: роли загружаются динамически из API

## [v0.7.1] - 2026-05-31

### Исправления
- PUT /users — first_name/last_name теперь сохраняются (json tags fix)
- Роли в select локализованы через RL()
- Язык убран из settings overlay, добавлен toggleLang()
- Роли вынесены в отдельное overlay через шестерёнку
- Добавлен restart.sh для перезапуска
