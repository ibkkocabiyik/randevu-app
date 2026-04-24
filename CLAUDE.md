# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Komutlar

```bash
npm run dev       # Vite dev sunucusu — http://localhost:3000
npm run build     # TypeScript derle + Vite production build
npm run lint      # ESLint
```

Backend local dev için ayrı çalıştırılır:
```bash
cd server && npm run dev   # Express API — http://localhost:4000
```

## Teknoloji Yığını

- **Frontend**: React 19 + TypeScript, Vite (port 3000)
- **State**: Zustand 5 (`persist` middleware → localStorage)
- **Routing**: React Router v7
- **Stil**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Backend (local)**: Express (`/server`), Supabase
- **Backend (prod)**: Vercel Serverless Functions (`/api`)
- **Realtime**: Supabase `postgres_changes` subscription

## Mimari

### İki Kullanıcı Rolü

**Müşteri** (`/book`, `/my-appointments`, `/profile`): `UserProtectedRoute` ile korunur, `useUserAuth.currentUser` kontrol edilir. Giriş yapılmamışsa `/login?next=<path>` yönlendirir.

**Admin** (`/admin/*`): `ProtectedRoute` ile korunur, `useAuth.isAuthenticated` kontrol edilir. Şifre tabanlı, tek kullanıcı (token içinde `role: 'admin'`).

### Veri Akışı

```
/src/lib/api.ts          → HTTP façade (tüm istekler JWT header ekler, BASE = VITE_API_URL ?? '')
/src/lib/data.ts         → useData Zustand store (appointments, services, employees, reviews)
                            + API→TS converter'lar (toAppointment, toService, ...)
                            + startRealtime() — Supabase subscription başlatır
/src/store/userAuth.ts   → useUserAuth (müşteri oturumu, profil, loyalty points)
/src/store/auth.ts       → useAuth (admin boolean flag)
/src/store/index.ts      → useStore (booking wizard state, bildirimler)
/src/store/reviews.ts    → useReviewStore (localStorage fallback, cross-tab sync için)
/src/store/sync.ts       → initSync() — localStorage.setItem'ı intercept eder, /__sync endpoint üzerinden cross-tab polling yapar (1500ms)
```

`useData` in-memory store, `useReviewStore` localStorage persist. Supabase yoksa (env boş) cross-tab sync `/__sync` HTTP polling ile çalışır — `initSync()` `main.tsx`'de app başlangıcında çağrılır.

### Backend İki Ortamda

| Ortam | Konum | Port | Notlar |
|-------|-------|------|--------|
| Local dev | `/server/src/` | 4000 | Express, CORS `*` |
| Production | `/api/` | — | Vercel Serverless Functions |

Her iki ortam da aynı Supabase DB'yi kullanır. Rota mantığı query param ile: `/api/auth?action=register|login|me|admin-login`.

`VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` boşsa `supabase = null` → realtime subscription çalışmaz, sadece localStorage sync devreye girer.

### Vite'daki `/__sync` Plugin

`vite.config.ts` içinde `syncPlugin()` Vite dev server'a `/__sync` endpoint ekler. Takip edilen localStorage key'leri: `randevu-store`, `randevu-user-auth`, `randevu-reviews`. Her `setItem` yazıldığında sunucudaki in-memory snapshot'a push edilir; diğer sekmeler 1.5s'de bir poll eder.

### Booking Wizard

`useStore.booking` state machine: `StepService` → `StepEmployee` → `StepDateTime` → `StepConfirm`. Son adımda `/api/appointments` POST.

### Kritik Domain Kuralları

- **Randevu çakışması olmamalı** — slot kontrolü çalışan başına yapılır, global değil
- Randevu oluşturma/güncelleme sonrası `useData.upsertAppointment()` ile optimistic update yapılır (rollback yok)
- Her çalışanın bağımsız çalışma saatleri vardır (`employee.workingHours`)

## Faz Durumu

| Faz | Durum |
|-----|-------|
| Faz 1 — Randevu akışı, admin dashboard | ✅ Aktif geliştirmede |
| Faz 2 — Auth, bildirimler (SMS/email/push) | ⏳ Planlandı |
| Faz 3 — Online ödeme, sadakat puanları, analitik | ⏳ Planlandı |
