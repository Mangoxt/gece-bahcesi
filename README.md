# Gece Bahçesi — Bir Ateşböceği Masalı

Ay söndü, bahçe karanlığa gömüldü. Elinde bir fener, yanında bir kıvılcım var — ve geri getirilecek üç ay parçası.

Tek dosyalık, tamamen kodla çizilmiş bir tarayıcı RPG'si. Kurulum yok, sunucu yok: `gece-bahcesi.html` dosyasını açman yeterli.

**Oyna:** https://mangoxt.github.io/gece-bahcesi/gece-bahcesi.html

## Özellikler

- Canvas ile elle boyanmış gece bahçesi: ay, sis, ateşböcekleri, söğüt, ay havuzu ve taş tapınak
- Sıra tabanlı savaş: niyet göstergesi, ışık/gölge/doğa zayıflıkları, zehir-kök-körlük durumları, 5 yetenek
- Seviye atlama, ay taşı ekonomisi, dükkân, dinlenme fenerleri
- Türkçe diyaloglar ve görev zinciri: Nine Mor, Nergis, söğüt, Taş Bekçi ve Kül Prensi
- Telefon optimizasyonu: joystick, dokunmatik düğmeler, güvenli alan boşlukları, düşük bellekli zemin önbelleği
- Üretken WebAudio müziği, otomatik kayıt (localStorage)
- **Ortak Yol (çok oyunculu):** aynı odada birlikte yürüme, sohbet balonları, emoji/quick-chat ve ortak dövüş göstergesi
- **Hikâye günlüğü:** oynadıkça açılan 8 bölümlük hikâye sekmesi
- **Sonsöz bölümü:** ana finalden sonra açılan “Kül Kuyusu” — üç düğüm, yeni boss ve gerçek şafak finali

## Ortak Yol (çok oyunculu)

Oyun içinde sağ alttaki **Ortak Yol** düğmesine bas.

**Aynı cihaz (kurulum yok):** bir ad ve oda kodu gir, “Odaya gir”e bas. Aynı tarayıcıda ikinci bir sekmede aynı oda kodunu gir — iki gezgin birbirini bahçede görür.

**İnternet üzerinden:** kendi WebSocket aktarıcını çalıştır:

```bash
node server/relay.js          # ws://localhost:8787
PORT=9000 node server/relay.js
```

Sonra oyunda “Aktarıcı adresi” alanına `ws://localhost:8787` yaz (yayındaysa `wss://sunucun/oda`). Aynı oda kodundaki oyuncular birbirini görür; sohbet ve ortak savaş göstergesi çalışır. Sunucu yalnızca mesaj iletir, oyun durumunu tutmaz.

## Kontroller

| Masaüstü | Telefon |
| --- | --- |
| `WASD` / oklar: yürü | sol joystick |
| `Shift`: koş | — |
| `E`: konuş / etkileşim | `E` düğmesi, diyaloğa dokun |
| `Q`: Kıvılcım'dan ipucu | `✦` düğmesi |
| `Tab`: günlük | `☰` düğmesi |
| Savaşta `1`–`6` | komut düğmeleri |
| — | `Ortak Yol` düğmesi: oda/sohbet |

## Geliştirme

Dosya bağımlılıksız; düzenle, tarayıcıda yenile. Sözdizimi kontrolü:

```bash
node --check <(sed -n '/^<script>$/,/^<\/script>$/p' gece-bahcesi.html | sed '1d;$d')
```
