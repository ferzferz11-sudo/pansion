# «Родные Пенаты» — CRM/ERP для сети пансионатов

Полноценная система управления сетью пансионатов: бронирования, клиенты, номера, услуги, отчёты.

## Стек

| Слой | Технология |
|------|-----------|
| Backend | Go (Gin/Fiber), gRPC |
| Web | React + TypeScript |
| Mobile | React Native + Expo |
| Database | PostgreSQL |
| Cache | Redis |
| Infra | Docker Compose |

## Структура

```
pansion/
├── backend/        # Go API (REST + gRPC)
├── web/            # React SPA (админ-панель)
├── mobile/         # React Native + Expo (клиентское приложение)
├── proto/          # Protocol Buffers (общие контракты)
├── docker-compose.yml
└── README.md
```

## Быстрый старт

```bash
# Запуск инфраструктуры
docker compose up -d postgres redis

# Backend
cd backend && go run ./cmd/server

# Web
cd web && npm install && npm start

# Mobile (requires Expo CLI)
cd mobile && npm install && npx expo start
```

## Функциональные модули

- Управление пансионатами (филиалы, локации)
- Номерной фонд (категории, загрузка, календарь)
- Бронирования (онлайн, телефон, соцсети)
- CRM: профили клиентов, история, лояльность
- Финансы: счета, оплаты, отчётность
- Услуги и калькуляция
- Админ-панель для персонала

---

*Разрабатывается Owl, ZOO company*
