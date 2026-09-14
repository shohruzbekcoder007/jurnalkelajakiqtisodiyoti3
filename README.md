# Moliyaviy texnologiyalar — MERN

"Moliyaviy texnologiyalar" ilmiy elektron jurnali (MongoDB + Express + React + Node.js).

```
backend/    Express + Mongoose REST API (port 5000)
frontend/   React + Vite (port 5173)
```

## Talablar

- Node.js 18+
- MongoDB (lokal yoki Atlas)

## Ishga tushirish

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # MONGO_URI ni kerak bo'lsa o'zgartiring
npm run seed              # bazani boshlang'ich ma'lumotlar bilan to'ldiradi
npm run dev               # http://localhost:5000
```

### 2. Frontend (alohida terminalda)

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Development'da Vite `/api` so'rovlarini avtomatik `localhost:5000` ga yo'naltiradi.
Production'da backend boshqa domenda bo'lsa, `frontend/.env` ga `VITE_API_URL=https://api.sizning-domen.uz` yozing va `npm run build` qiling.

## API

| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/articles?page=&limit=&rubric=&q=` | Maqolalar ro'yxati (sahifalash, rukn va nom bo'yicha qidiruv) |
| GET | `/api/articles/:slug` | Bitta maqola |
| GET | `/api/rubrics` | Ruknlar va maqolalar soni |
| GET | `/api/issues/current` | So'nggi son va undagi maqolalar soni |
| GET | `/api/pages/:slug` | Statik sahifa (`jurnal-haqida`, `tahrir-kengashi`, `jurnal-manzili`, `chop-etish-tartibi`, `axborot-xati`) |
| POST | `/api/submissions` | "Maqola yuborish" shakli (`title`, `authors`, `email`, `abstract`, `message`) |

## Sahifalar

| Yo'l | Sahifa |
|---|---|
| `/` | Bosh sahifa |
| `/arxiv` | Maqolalar arxivi (`?q=`, `?rukn=`, `?sahifa=`) |
| `/ruknlar` | Jurnal ruknlari |
| `/jurnal-haqida` | Jurnal haqida |
| `/tahrir-kengashi` | Tahririyat kengashi |
| `/maqola-yuborish` | Maqola yuborish |
| `/maqola/:slug` | Maqola sahifasi |
