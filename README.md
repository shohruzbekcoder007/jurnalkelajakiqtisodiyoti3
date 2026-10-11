# Kelajak iqtisodiyoti va raqamli transformatsiyalar — MERN

"Kelajak iqtisodiyoti va raqamli transformatsiyalar" ilmiy elektron jurnali (MongoDB + Express + React + Node.js).

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

## Serverga o'rnatish (PM2)

Production'da bitta jarayon yetarli: Express ham API'ni, ham tayyor frontend fayllarini beradi.

```bash
# 1. Kod va paketlar
git clone https://github.com/shohruzbekcoder007/jurnalkelajakiqtisodiyoti3.git
cd jurnalkelajakiqtisodiyoti3
npm ci --prefix backend --omit=dev
npm ci --prefix frontend

# 2. Sozlamalar
cp backend/.env.example backend/.env
nano backend/.env          # MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 3. Frontend'ni yig'ish (backend shu papkadan beradi)
npm run build --prefix frontend

# 4. Bazani to'ldirish (faqat birinchi marta)
npm run seed --prefix backend

# 5. PM2 bilan ishga tushirish
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup             # chiqqan buyruqni nusxalab bajaring — server qayta yuklansa ham ishlaydi
```

Sayt `http://<server>:5000` da ochiladi. Foydali buyruqlar: `pm2 status`, `pm2 logs kelajak-iqtisodiyoti`, `pm2 restart kelajak-iqtisodiyoti`.

### Kodni yangilash

```bash
git pull
npm ci --prefix backend --omit=dev
npm ci --prefix frontend && npm run build --prefix frontend
pm2 restart kelajak-iqtisodiyoti
```

### Nginx (domen va HTTPS uchun)

```nginx
server {
    server_name jurnal.example.uz;
    client_max_body_size 25M;   # PDF yuklash uchun

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS: `sudo certbot --nginx -d jurnal.example.uz`.

### Zaxira nusxa

- Baza: `mongodump --db moliyaviy_texnologiyalar --out /backup/$(date +%F)`
- Yuklangan PDF'lar: `backend/uploads/` papkasi

## Admin panel

Manzil: **http://localhost:5173/admin**

Birinchi admin `backend/.env` dagi `ADMIN_EMAIL` / `ADMIN_PASSWORD` bilan yaratiladi (`npm run seed` yoki `npm run create-admin`).
Parolni tiklash yoki yangi admin qo'shish:

```bash
cd backend
npm run create-admin -- admin@tdiu.uz "YangiParol123" "Ism Familiya"
```

Paneldagi bo'limlar:

- **Maqolalar** — qo'shish, tahrirlash, o'chirish, PDF yuklash (20 MB gacha), qidiruv va rukn bo'yicha filtr
- **Ruknlar** — qo'shish, nomi/tartibini o'zgartirish (maqolasi bor ruknni o'chirib bo'lmaydi)
- **Tanlangan maqolalar** — bosh sahifadagi 3 ta kartaga maqola tanlash
- **Jurnal sonlari** — yangi son ochish, sonni yopish/qayta ochish (yopiq songa maqola biriktirib bo'lmaydi), "So'nggi son"ni belgilash, sonning to'liq PDF nashri: tayyor PDF yuklash yoki **maqolalardan kitob yig'ish** (muqova + mundarija + barcha maqolalar; PDF'i yo'q maqola matnidan sahifa yaratiladi)
- **Sahifalar** — "Jurnal haqida", "Tahririyat kengashi" va boshqa matnli sahifalar; yangi sahifa `/sahifa/:slug` da ochiladi
- **Arizalar** — "Maqola yuborish" orqali kelgan arizalar, holatini o'zgartirish
- **Sozlamalar** — parolni o'zgartirish

Production uchun `JWT_SECRET` ni uzun tasodifiy qiymatga almashtiring. Yuklangan PDF'lar `backend/uploads/` papkasida saqlanadi.

## API

| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/api/articles?page=&limit=&rubric=&q=` | Maqolalar ro'yxati (sahifalash, rukn va nom bo'yicha qidiruv) |
| GET | `/api/articles/:slug` | Bitta maqola |
| GET | `/api/rubrics` | Ruknlar va maqolalar soni |
| GET | `/api/issues/current` | So'nggi son va undagi maqolalar soni |
| GET | `/api/pages/:slug` | Statik sahifa (`jurnal-haqida`, `tahrir-kengashi`, `jurnal-manzili`, `chop-etish-tartibi`, `axborot-xati`) |
| POST | `/api/submissions` | "Maqola yuborish" shakli (`title`, `authors`, `email`, `abstract`, `message`) |
| POST | `/api/auth/login` | Admin kirishi → JWT token |
| GET/PUT | `/api/auth/me`, `/api/auth/password` | Joriy admin, parolni o'zgartirish |
| — | `/api/admin/*` | Himoyalangan CRUD: `articles` (+ `/:id/pdf`), `rubrics`, `issues`, `pages`, `submissions`, `stats` (`Authorization: Bearer <token>`) |

## Sahifalar

| Yo'l | Sahifa |
|---|---|
| `/` | Bosh sahifa |
| `/arxiv` | Maqolalar arxivi (`?q=`, `?rukn=`, `?sahifa=`) |
| `/sonlar` | Jurnal sonlari arxivi |
| `/sonlar/:yil/:son` | Son sahifasi: mundarija va to'liq PDF nashr |
| `/ruknlar` | Jurnal ruknlari |
| `/jurnal-haqida` | Jurnal haqida |
| `/tahrir-kengashi` | Tahririyat kengashi |
| `/maqola-yuborish` | Maqola yuborish |
| `/maqola/:slug` | Maqola sahifasi |
