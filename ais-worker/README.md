# AIS katmanı (yakın gemiler)
Yayınlama GitHub Actions ile ("AIS Worker yayınla").

Bir kez: GitHub → tekne-panel → Settings → Secrets and variables → Actions → New repository secret
- AIS_KEY: aisstream.io API anahtarı
- CLOUDFLARE_API_TOKEN: Cloudflare → My Profile → API Tokens → "Edit Cloudflare Workers" şablonu
- CLOUDFLARE_ACCOUNT_ID: Cloudflare Workers sayfasındaki Account ID

Sonra Actions → "AIS Worker yayınla" → Run workflow. Log'daki workers.dev adresini panelde gir:
https://aksi.systems/Tekne-panel/?ais=1 → Menü → Yakın gemiler (AIS). Test modunu kapatmak: ?ais=0

Not: Seyir/çarpışma önleme için güvenilmez; AIS yayını yapmayan tekneler görünmez.
