# AIS katmanı (yakın gemiler)
1. aisstream.io'da ücretsiz hesap aç, API anahtarı al.
2. Bu klasörde: `npx wrangler login`, ardından `npx wrangler deploy`
3. `npx wrangler secret put AIS_KEY` (anahtarı yalnızca buraya yapıştır)
4. Paneli test modunda aç: https://aksi.systems/Tekne-panel/?ais=1
5. Menü → "Yakın gemiler (AIS)" → deploy çıktısındaki workers.dev adresini gir.
Test modunu kapatmak için: ?ais=0

Not: Seyir/çarpışma önleme için güvenilmez; AIS yayını yapmayan tekneler görünmez.
