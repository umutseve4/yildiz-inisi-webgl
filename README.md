# ⛷️ Yıldız İnişi

**Gece yamacından aşağı in, ağaçlara çarpma, yıldızları topla.** Tarayıcıda açılır, kurulum yok, indirme yok, tek bir `index.html` dosyası.

[![Oyna](https://img.shields.io/badge/▶%20Hemen%20oyna-canlı-FF4D4F?style=for-the-badge)](https://umutseve4.github.io/yildiz-inisi-webgl/)
[![Tek dosya](https://img.shields.io/badge/tek%20dosya-27.873%20bayt-2FD3A7?style=for-the-badge)](index.html)
[![Statik test](https://img.shields.io/badge/statik%20assertion-155-4C8DFF?style=for-the-badge)](tests/qa.mjs)
[![Tarayıcı testi](https://img.shields.io/badge/Chromium%20kabul%20testi-29-A855F7?style=for-the-badge)](tests/browser.spec.mjs)
[![CI](https://github.com/umutseve4/yildiz-inisi-webgl/actions/workflows/ci.yml/badge.svg)](https://github.com/umutseve4/yildiz-inisi-webgl/actions/workflows/ci.yml)

---

## 🎮 30 saniyede ne oluyor

Sayfayı açıyorsun, "İnişe başla" diyorsun ve kayakçı yamaçtan aşağı süzülmeye başlıyor. Pist kendi kendine üretiliyor, yani her metre ilerlediğinde önünde daha önce var olmayan ağaçlar, kayalar, yıldızlar ve kapılar beliriyor. Ok tuşlarıyla sağa sola dönüyorsun, boşluk tuşuyla zıplayıp engelin üstünden aşıyorsun.

Yıldız topladıkça kombo çarpanın büyüyor, sekize kadar çıkıyor. Ağaca çarptığında kombo sıfırlanıyor, hızın kesiliyor ve bir can gidiyor. Üç can bitince iniş kapanıyor, puanın ve gittiğin mesafe ekrana geliyor. Aşağı indikçe hız da zorluk da artıyor, 1400 metrede tavana vuruyor.

Üç atmosfer var ve oyun sırasında istediğin an değiştirebiliyorsun: **Gece** (mavi sis, uzak görüş), **Şafak** (turuncu ışık), **Tipi** (yoğun sis, görüş kısa, en zoru).

## 🕹️ Kontroller

| Girdi | Ne yapar |
|---|---|
| `←` `→` veya `A` `D` | Sağa sola dön |
| `Boşluk` | Zıpla, havadayken çarpışma almazsın |
| `P` | Duraklat ve devam et |
| `R` | İnişi baştan başlat |
| `Enter` | Açılış ekranından başlat |
| Ekranın üst %35'ine dokun | Zıpla (mobil) |
| Ekranın soluna / sağına dokun | Sola / sağa dön (mobil) |
| Sağ üstteki üç düğme | Gece, Şafak, Tipi modunu değiştir |

## 🚀 Kendi bilgisayarında çalıştır

```bash
git clone https://github.com/umutseve4/yildiz-inisi-webgl.git
cd yildiz-inisi-webgl
npm run serve      # http://localhost:4173
```

Testleri de çalıştırmak istersen:

```bash
npm install
npx playwright install --with-deps chromium
npm test           # 155 statik assertion + 29 Chromium kabul testi
```

Üçüncü adım yok. `index.html` dosyasını çift tıklayıp doğrudan açman da yeterli, tek koşul internet bağlantısı çünkü three.js CDN'den geliyor.

## 🧩 Nasıl yapıldı

| Katman | Ne var |
|---|---|
| Görsel | three.js 0.169.0, `InstancedMesh` ile ağaç, kaya, yıldız, kapı direkleri; `FogExp2` ile derinlik; 2400 parçacıklı kar |
| Zemin | Tek `PlaneGeometry`, her karede yükseklik fonksiyonuna göre büküyor ve oyuncuyla birlikte kaydırıyor, sonsuz yamaç bu yüzden bellek yemiyor |
| Pist üretimi | `mulberry32` tohumlu üreteç. Aynı tohum aynı pisti veriyor, testler bu yüzden deterministik |
| Oyun mantığı | Render'dan tamamen ayrı, saf fonksiyonlar hâlinde `window.YI` altında. Node içinde tarayıcısız çalışıyor |
| Test kancası | `window.__yi` üzerinden faz, kare sayacı, `forceCrash()` ve `collectStar()` |
| Erişilebilirlik | Mod düğmelerinde `aria-pressed`, canvas'ta `aria-label`, `:focus-visible` odak halkası, `prefers-reduced-motion` desteği, WebGL kapalıysa açıklamalı yedek ekran |

Depoda tek bir görsel, ses veya model dosyası yok. Ağaç bir koni, kaya bir ikosahedron, yıldız bir oktahedron, kayakçı bir kapsül. Bütün görünüm geometriden ve ışıktan geliyor.

## 📊 Sayılar nereden geliyor

| Sayı | Kaynak |
|---|---|
| 27.873 baytlık tek dosya | `wc -c index.html`, CI'da 122.880 bayt tavanına karşı denetleniyor |
| 155 statik assertion | `node tests/qa.mjs` çıktısı, CI 155 tabanının altına düşerse hata veriyor |
| 29 kabul testi | `npx playwright test`, gerçek Chromium'da SwiftShader WebGL ile, CI 29 tabanını koruyor |
| 3 atmosfer modu | `YI.C.MODES` |
| 1400 m zorluk doygunluğu | `YI.difficultyAt` |

CI iki işi ayrı koşturuyor: `qa` işi hem assertion tabanını hem tek dosya sözleşmesini (harici varlık yok, `http://` yok, three.js sürümü pinli) denetliyor. `browser` işi Chromium indirip 29 kabul testini gerçekten oynatıyor.

## 🚧 Neyi iddia etmiyorum

- Skor kaydı yok. En iyi puan yalnızca sekme açık kaldığı sürece hafızada duruyor.
- Ses yok.
- Mobil dokunmatik kontroller çalışıyor ama asıl hedef klavye. Küçük ekranlarda HUD sıkışabilir.
- three.js CDN'den yükleniyor, yani çevrimdışı açılmıyor.
- Çok oyunculu, seviye editörü, kayıt/yükleme gibi özellikler yok. Bu bir oturuşluk bir iniş.
- FPS ölçümü yapılmadı, o yüzden performans rakamı vermiyorum.

---

MIT lisanslı. Umut Sever.
