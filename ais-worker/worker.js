// Aksi AIS: aisstream.io -> Cloudflare Worker -> harita
const VARSAYILAN = { lat: 40.862, lon: 29.144 };
const KUTU_NM = 12;            // en buyuk yaricap (10) + pay
const ESKI_MS = 30 * 60e3;     // demirli gemiler seyrek yayinlar
const BOSTA_MS = 15 * 60e3;    // istek gelmezse baglanti kapanir
const KONUM_TIPLERI = ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport"];

export function uzaklikNm(a, b) {
  const r = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * r / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2;
  return 2 * 3440.065 * Math.asin(Math.sqrt(h));
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const izinli = (env.IZINLI_ORIGIN || "https://aksi.systems").split(",");
    const cors = {
      "Access-Control-Allow-Origin": izinli.includes(origin) ? origin : izinli[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (new URL(req.url).pathname !== "/ships" || req.method !== "POST")
      return new Response("Bulunamadi", { status: 404, headers: cors });
    if (origin && !izinli.includes(origin)) return new Response("Yasak", { status: 403, headers: cors });
    const res = await env.AIS.get(env.AIS.idFromName("tek")).fetch(req);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
};

export class AisHub {
  constructor(state, env) {
    this.state = state; this.env = env;
    this.gemiler = new Map(); this.ws = null; this.merkez = null;
    this.sonIstek = 0; this.sonDeneme = 0; this.sonAbone = 0; this.sonVeri = 0; this.hata = null;
  }

  async fetch(req) {
    const q = await req.json().catch(() => ({}));
    const gecerli = Number.isFinite(q.lat) && Number.isFinite(q.lon) && Math.abs(q.lat) <= 85 && Math.abs(q.lon) <= 180;
    const merkez = gecerli ? { lat: q.lat, lon: q.lon } : VARSAYILAN;
    const nm = Math.min(10, Math.max(1, Number(q.nm) || 5));
    const simdi = Date.now();
    this.sonIstek = simdi;
    this.baglan(merkez);
    await this.state.storage.setAlarm(simdi + 30e3);

    const gemiler = [];
    for (const [id, g] of this.gemiler) {
      if (simdi - g.gorulme > ESKI_MS) { this.gemiler.delete(id); continue; }
      if (g.lat === undefined) continue;
      const d = uzaklikNm(merkez, g);
      if (d <= nm) gemiler.push({ ...g, uzaklik: +d.toFixed(2), yas: Math.round((simdi - g.konumZamani) / 1000) });
    }
    gemiler.sort((a, b) => a.uzaklik - b.uzaklik);
    return Response.json({
      bagli: this.ws?.readyState === 1, hata: this.hata,
      sonVeriSn: this.sonVeri ? Math.round((simdi - this.sonVeri) / 1000) : null,
      nm, merkez, gemiler,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  baglan(merkez) {
    const simdi = Date.now();
    if (this.ws && this.ws.readyState <= 1) {
      if (uzaklikNm(merkez, this.merkez) > 2 && simdi - this.sonAbone > 1500) {
        this.merkez = merkez;
        if (this.ws.readyState === 1) this.aboneOl(this.ws);
      }
      return;
    }
    this.merkez = merkez;
    if (simdi - this.sonDeneme < 10e3) return;
    this.sonDeneme = simdi;
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    ws.binaryType = "arraybuffer";
    this.ws = ws;
    ws.addEventListener("open", () => this.aboneOl(ws));
    ws.addEventListener("message", (e) => this.isle(e.data));
    ws.addEventListener("close", (e) => {
      if (this.ws !== ws) return;
      this.ws = null; this.hata = this.hata || `Baglanti kapandi (${e.code})`;
    });
    ws.addEventListener("error", () => { this.hata = "Baglanti hatasi"; });
  }

  aboneOl(ws) {
    const { lat, lon } = this.merkez;
    const dLat = KUTU_NM / 60, dLon = dLat / Math.cos(lat * Math.PI / 180);
    this.sonAbone = Date.now();
    ws.send(JSON.stringify({
      APIKey: this.env.AIS_KEY,
      BoundingBoxes: [[[lat - dLat, lon - dLon], [lat + dLat, lon + dLon]]],
      FilterMessageTypes: [...KONUM_TIPLERI, "ShipStaticData"],
    }));
  }

  async isle(veri) {
    let m;
    try {
      const metin = typeof veri === "string" ? veri
        : veri instanceof ArrayBuffer ? new TextDecoder().decode(veri) : await veri.text();
      m = JSON.parse(metin);
    } catch { return; }
    if (m.error) { this.hata = String(m.error); return; }
    const meta = m.MetaData, govde = m.Message?.[m.MessageType];
    if (!meta?.MMSI || !govde) return;
    const simdi = Date.now();
    const g = this.gemiler.get(meta.MMSI) || { mmsi: meta.MMSI };
    const ad = String(meta.ShipName || govde.Name || "").trim();
    if (ad) g.ad = ad;
    if (m.MessageType === "ShipStaticData") {
      g.tip = govde.Type; g.hedef = String(govde.Destination || "").trim();
    } else if (KONUM_TIPLERI.includes(m.MessageType)) {
      const lat = govde.Latitude ?? meta.Latitude ?? meta.latitude;
      const lon = govde.Longitude ?? meta.Longitude ?? meta.longitude;
      if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return;
      g.lat = lat; g.lon = lon; g.konumZamani = simdi;
      g.hiz = govde.Sog < 102.3 ? govde.Sog : null;
      g.rota = govde.Cog < 360 ? govde.Cog : null;
      g.pruva = govde.TrueHeading < 360 ? govde.TrueHeading : null;
    } else return;
    g.gorulme = simdi; this.sonVeri = simdi; this.hata = null;
    this.gemiler.set(meta.MMSI, g);
  }

  async alarm() {
    if (Date.now() - this.sonIstek > BOSTA_MS) {
      const ws = this.ws; this.ws = null; ws?.close(1000, "bosta");
      return;
    }
    await this.state.storage.setAlarm(Date.now() + 30e3);
  }
}
