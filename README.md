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

## Kontroller

| Masaüstü | Telefon |
| --- | --- |
| `WASD` / oklar: yürü | sol joystick |
| `Shift`: koş | — |
| `E`: konuş / etkileşim | `E` düğmesi, diyaloğa dokun |
| `Q`: Kıvılcım'dan ipucu | `✦` düğmesi |
| `Tab`: günlük | `☰` düğmesi |
| Savaşta `1`–`6` | komut düğmeleri |

## Geliştirme

Dosya bağımlılıksız; düzenle, tarayıcıda yenile. Sözdizimi kontrolü:

```bash
node --check <(sed -n '/^<script>$/,/^<\/script>$/p' gece-bahcesi.html | sed '1d;$d')
```
