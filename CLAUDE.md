# CLAUDE.md

Bu dosya, bu depoda çalışan Claude Code (claude.ai/code) örneklerine rehberlik sağlar.

## Proje Durumu

**Faz 1 (MVP) aktif geliştirmede.** Temel randevu akışı ve admin dashboard çalışıyor; tüm veriler Zustand + localStorage ile tutulur (backend yok).

## Teknoloji Yığını

- **Frontend**: React 19 + TypeScript, Vite
- **State yönetimi**: Zustand (`persist` middleware ile localStorage'a yazılır)
- **Routing**: React Router v7
- **Stil**: Tailwind CSS v4 (`@tailwindcss/vite` plugin), dark mode destekli

```
npm install       # bağımlılıkları yükle
npm run dev       # geliştirme sunucusunu başlat (http://localhost:5173)
npm run build     # production derlemesi
npm run lint      # lint
```

## Mimari Plan

### İki farklı kullanıcı rolü
1. **Müşteri** — randevu alır, geçmişini görür, hizmet değerlendirir
2. **Admin (İşletme Sahibi)** — çalışanları, hizmetleri, takvimi yönetir ve analizleri görür

### Temel domain kısıtlamaları
- **Çakışan randevu olmamalı** — slot oluşturma, çalışan başına hizmet süresini dikkate almalıdır
- **Çalışan bazlı müsaitlik** — her çalışanın bağımsız çalışma saatleri vardır; rezervasyon mantığı global değil, çalışan başına slot kontrol etmelidir
- **Çakışma önleme kritiktir** — sistemin temel değişmezi

### Sayfa yapısı
**Müşteri tarafı**: ana sayfa/randevu akışı → hizmet seçimi → takvim/saat seçimi → randevularım → profil

**Admin paneli**: dashboard → takvim görünümü → randevu listesi → müşteri yönetimi (notlu mini-CRM) → hizmet yönetimi → çalışan yönetimi

### UI/UX kısıtlamaları
- Mobil öncelikli; randevu tamamlamak için maksimum 3 dokunuş
- Skeleton loading durumları zorunlu (boş ekran yanıpı olmamalı)
- Hover/transition üzerinde micro-interaction'lar
- Erişilebilirlik standartları (WCAG)

## Yol Haritası

| Faz | Kapsam |
|-----|--------|
| Faz 1 (MVP) | Randevu akışı, admin dashboard, temel takvim |
| Faz 2 | Kullanıcı hesabı (telefon/e-mail auth), bildirimler (SMS/e-mail/push), hizmet yönetimi |
| Faz 3 | Online ödeme + kapora sistemi, sadakat puanları, analitik dashboard |

## Tam Gereksinimler

### Müşteri Özellikleri
- Müsait slotları görüntüleme, randevu oluşturma/iptal/yeniden planlama, geçmişi görme
- Opsiyonel hesap: telefon/e-mail girişi, profil, favori hizmetler
- Bildirimler: hatırlatmalar ve değişiklik uyarıları
- Tahmini süre ve fiyat gösterimi olan hizmet kategorileri
- Hizmet sonrası puanlama ve yorum

### Admin Özellikleri
- Dashboard: günlük/haftalık/aylık randevu yoğunluğu, no-show oranı, popüler hizmetler, gelir tahmini
- Randevu CRUD + manuel müşteri ekleme + yoğun saatleri bloklama
- Çalışan yönetimi: birden fazla berber, çalışan bazlı planlama, çalışma saatleri
- Hizmet yönetimi: fiyat ve süreyle birlikte ekleme/düzenleme/silme
- Müşteri CRM: liste, randevu geçmişi, özel notlar (örn. "kısa kesim seviyor")

### Opsiyonel / Gelecek Özellikler
- Online ödeme + kapora (no-show azaltır)
- Sadakat puanları ve indirim eşikleri
- Kupon/kampanya sistemi
- Google Calendar senkronizasyonu
- Hizmet sürelerine göre otomatik slot oluşturma
