# The Moon Tekne Paneli

Lena 32 "The Moon" teknesinin 3B modeli üzerinden ışıkları kontrol eden web paneli. Labobinx xRoute kontrol ünitesine Web Bluetooth ile bağlanır.

## Yayınlama (GitHub Pages)

1. GitHub'da yeni bir depo oluştur (ör. `tekne-paneli`).
2. `index.html` ve bu `README.md` dosyasını deponun köküne yükle.
3. Depoda **Settings → Pages** bölümüne git.
4. **Source** olarak `Deploy from a branch`, dal olarak `main`, klasör olarak `/ (root)` seç ve kaydet.
5. Bir iki dakika sonra sayfa `https://<kullanıcı-adın>.github.io/tekne-paneli/` adresinde açılır.

## Ekran

- Üstte ince tek satır: hava durumu, ortada sekmeler (Kontrol, Harita, Kamera, Ayarlar), sağda ekran düzeni.
- **Tek / İkili:** İkili seçilince ekran ikiye bölünür; 1. ve 2. ekrana Kontrol, Harita veya Kamera atanır. iPad'de yan yana, dikey telefonda alt alta durur. Seçim hatırlanır.
- **Tam ekran:** Sağ üstteki buton. iPhone/iPad'de en iyi yol Safari → Paylaş → Ana Ekrana Ekle; oradan açınca adres çubuğu olmadan açılır (Bluetooth için Bluefy gerekir).

## Sekmeler

- **Kontrol:** 3B tekne. Solda görünüm butonları ve ışık listesi, sağ altta tekne verileri (akü %, V, A, W; temiz/gri/kirli su; dış/iç sıcaklık, nem, basınç).
- **Harita:** GPS konumu, sürat, rota, seyir. Haritalar: Koyu (CARTO), Sokak, Uydu, Deniz, Derinlik (EMODnet), Okyanus (MapTiler, anahtar gerekli). Derinlik eğrileri: EMODnet veya OpenSeaMap. Deniz işaretleri: OpenSeaMap.
- **Kamera:** Ön ve arka kamera (MJPEG / JPEG adresi, https).
- **Ayarlar:** Bluetooth, senaryolar, harita anahtarları, kameralar, ışık eşleştirme, sürüm.

## Tekneye bağlanma

- **iPhone:** Safari Web Bluetooth desteklemez. Sayfayı **Bluefy** tarayıcısıyla aç.
- **Android / bilgisayar:** Chrome veya Edge ile aç.
- Bağlanmadan önce telefondaki xRoute uygulamasını kapat; aynı anda iki uygulama bağlanamaz.
- Ayarlar → **Tekneye bağlan**. Bağlanınca `InitNextion` gönderilir ve ünite tüm durumları bildirir.

## xRoute protokolü

- BLE servis `0xFFE0`, karakteristik `0xFFE1` (yazma + bildirim), düz ASCII satırlar, sonunda `\n`.
- `swN` (1–16): anahtarı aç/kapat. Ünite `swN.val=1/0` ile yanıt verir.
- `APDIMn.val=0..255`: dimmer 1–4. RGB için `APDIM5/6/7`.
- Gelen ölçümler: `M.BatPr` (akü %), `M.V1` (V ×10), `M.A0` (A ×10), `M.G1TXT` (temiz su ×10), `M.T2` (iç sıcaklık ×10).

## Işık eşleştirme

Varsayılan kanallar tahmindir. Ayarlar → **Işık eşleştirme** bölümünden her ışığın kanalını değiştir. Seçimler tarayıcıda saklanır.

| Işık | Varsayılan kanal |
|---|---|
| Kokpit spotları | Dimmer 2 |
| Basamak | sw15 |
| Kıç platform | Dimmer 4 |
| Salon tavan | Dimmer 1 |
| Lamba | sw11 |
| Kamara | Dimmer 3 |
| Okuma lambası | sw14 |
| Gövde ambiyans | RGB (APDIM5–7) |
| Demir feneri | atanmadı |
| Seyir fenerleri | atanmadı |

## Teknik

Tek dosya: `index.html`. Three.js r128 ve Leaflet 1.9.4 cdnjs'den yüklenir. Hava durumu Open-Meteo'dan (Tuzla) alınır.
