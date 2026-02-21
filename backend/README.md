# 🏋️ FitTrack — Telegram Mini App

Фитнес-трекер: КБЖУ, тренировки, вода, статистика.  
**Stack: React + Vite · FastAPI · PostgreSQL · Alembic · Docker**

## Структура

```
fitness-app/
├── docker-compose.yml         # Postgres + Backend + Frontend одной командой
├── backend/
│   ├── main.py                # FastAPI роуты
│   ├── models.py              # SQLAlchemy таблицы
│   ├── schemas.py             # Pydantic схемы
│   ├── crud.py                # Бизнес-логика
│   ├── database.py            # Подключение к PostgreSQL
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── .env.example
│   └── alembic/
│       ├── env.py
│       └── versions/0001_initial.py
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/index.js
    │   ├── pages/
    │   │   ├── TodayScreen.jsx     # КБЖУ + вода
    │   │   ├── WorkoutsScreen.jsx  # Тренировки
    │   │   ├── StatsScreen.jsx     # Графики
    │   │   └── ProfileScreen.jsx   # Профиль
    │   └── index.css
    ├── Dockerfile
    ├── nginx.conf
    └── package.json
```

---

## 🚀 Быстрый старт (Docker — рекомендуется)

```bash
# Поднять всё одной командой (Postgres + Backend + Frontend)
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- Docs (Swagger): http://localhost:8000/docs

---

## 💻 Локальный запуск без Docker

### 1. PostgreSQL
Установи и запусти PostgreSQL, создай базу:
```sql
CREATE DATABASE fitness_db;
```

### 2. Backend
```bash
cd backend
cp .env .env          # заполни DATABASE_URL
pip install -r requirements.txt
alembic upgrade head           # применить миграции
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

---

## 🌐 Деплой в продакшен

### Backend (Railway / Render / VPS)
1. Задеплой папку `backend/`
2. Укажи переменную окружения:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
3. Команда запуска: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000`

### Frontend (Vercel / Netlify)
1. Задеплой папку `frontend/`
2. Укажи переменную: `VITE_API_URL=https://your-backend.railway.app`
3. `npm run build` → папка `dist`

### Telegram Bot
1. Создай бота через @BotFather
2. `Menu Button` → `Web App` → укажи URL фронтенда
3. Готово — бот открывает Mini App

---

## 📡 API

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/health` | Health check |
| GET/POST | `/profile/{tg_id}` | Профиль пользователя |
| GET | `/nutrition/{tg_id}/{date}` | КБЖУ за день |
| POST | `/nutrition/meal` | Добавить приём пищи |
| DELETE | `/nutrition/meal/{id}` | Удалить |
| POST | `/nutrition/water` | Логировать воду |
| GET | `/workouts/{tg_id}` | Список тренировок |
| POST | `/workouts` | Создать тренировку |
| POST | `/workouts/{id}/exercises` | Добавить упражнение |
| DELETE | `/workouts/{id}` | Удалить тренировку |
| GET | `/stats/{tg_id}?days=30` | Статистика |

---

## 🔜 Следующие шаги

- [ ] База продуктов питания (поиск по названию)
- [ ] Push-уведомления через бота
- [ ] Замеры тела в динамике
- [ ] Поиск упражнений из готовой базы
- [ ] Авторизация через Telegram WebApp.initData
