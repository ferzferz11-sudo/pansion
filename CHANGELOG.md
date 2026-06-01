# Changelog

## [v1.0.0] - 2026-06-01

### Новое
- **Мобильное приложение** (Expo + React Native + TypeScript) в `/root/pansion/mobile/`
  - React Navigation с bottom tabs, ролевая видимость вкладок
  - Экраны: Login, Dashboard, Номера, Гости, Задачи, SOS, Финансы, Медицина, Сотрудники
  - Auth с AsyncStorage persistence
  - API клиент с Bearer токеном и относительными путями (/api/v1)
  - Статусы номеров: tap-to-change (свободен↔занят)
  - Задачи: tap-to-complete workflow
  - SOS: кнопка "Решено"
  - Медицина: toggle приёма лекарств
  - Pull-to-refresh на всех экранах
  - Web build через `expo export`, деплой в `/var/www/lavender/mobile/`
  - Node.js прокси-сервер (server.js) для SPA + API proxy
  - Systemd сервис `pansion-mobile-web` для автозапуска
- **log-monitor** — systemd сервис для автозапуска (`log-monitor.service`)

### Исправления
- **Nginx**: удалён location `/pansion` (legacy), оставлен только `/pansion-react`
- **Nginx**: добавлен `/mobile` → прокси на Node.js :8081
- **Nginx**: добавлен `/_expo/` → прокси на Node.js :8081 для JS-бандлов
- **Nginx**: `/api/v1/` напрямую проксирует на бэкенд :8080 (без лишних hop)
- **API URL**: мобилка использует относительный путь `/api/v1` вместо абсолютного `http://13.140.25.249:8080/api/v1`
- **Dashboard**: кликабельные stat cards → навигация на соответствующие вкладки
- **Dashboard**: скрытие SOS alert/card при sos_active=0
- **Seed**: исправлен scope переменной fid, добавлен pension_id для guests/maid_tasks
- **Seed**: room_id для всех guests
- **Переводы**: expensesByCategory, guestsCount на дашборде

### Инфраструктура
- Systemd сервисы: `pansion`, `log-monitor`, `pansion-mobile-web` — все с Restart=on-failure
- Web-приложение (React) задеплоено в `/var/www/lavender/pansion-react/`
- Мобильное приложение задеплоено в `/var/www/lavender/mobile/` + Node.js прокси на :8081

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
- Settings overlay (tab visibility per role), Roles overlay (CRUD)
- Auth context с localStorage, Lang context (RU/EN) с полными переводами
- API клиент с Bearer токеном

## [v0.8.0] - 2026-05-31

### Новое
- **Медицина**: 3 API endpoint'а, UI с назначениями и журналом
- **Demo данные**: 8 назначений, 8 логов, гости привязаны к комнатам

### Исправления
- Роли появляются в select после создания/удаления
- Settings: роли загружаются динамически из API

## [v0.7.1] и ранее

- См. git history для полного списка изменений
