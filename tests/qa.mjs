/* Yildiz Inisi. Statik yapi ve saf mantik denetimi. Tarayici gerektirmez. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

let passed = 0;
const failures = [];
function ok(name, cond) {
  if (cond) { passed++; return; }
  failures.push(name);
}
function near(name, a, b, eps) { ok(name + " (" + a + " ~ " + b + ")", Math.abs(a - b) <= eps); }

/* 1. Dosya yapisi ve tasima sozlesmesi */
ok("doctype", /^<!DOCTYPE html>/i.test(html));
ok("lang tr", /<html lang="tr">/.test(html));
ok("charset", /<meta charset="utf-8"/i.test(html));
ok("viewport", /name="viewport"/.test(html));
ok("description meta", /name="description"/.test(html));
ok("theme-color", /name="theme-color"/.test(html));
ok("title", /<title>[^<]{10,}<\/title>/.test(html));
ok("tek dosya, harici css yok", !/<link[^>]+stylesheet/i.test(html));
ok("harici gorsel yok", !/<img\b/i.test(html));
ok("http yok", !/http:\/\//.test(html));
ok("eval yok", !/\beval\(/.test(html));
ok("document.write yok", !/document\.write\(/.test(html));
ok("innerHTML yok", !/\.innerHTML\s*=/.test(html));
ok("three pinlenmis", /unpkg\.com\/three@0\.169\.0\/build\/three\.module\.js/.test(html));
ok("importmap var", /<script type="importmap">/.test(html));
ok("module script var", /<script type="module">/.test(html));
ok("logic script module degil", html.indexOf("<script>") < html.indexOf("<script type=\"module\">"));
ok("uzun tire yok", !/[\u2013\u2014]/.test(html));
ok("boyut 120 KB altinda", Buffer.byteLength(html, "utf8") < 120 * 1024);
ok("boyut 15 KB uzerinde", Buffer.byteLength(html, "utf8") > 15 * 1024);
ok("fallback bolumu", /id="fallback"/.test(html));
ok("webgl try/catch", /catch \(err\)/.test(html));
ok("test kancasi", /window\.__yi\s*=/.test(html));
ok("prefers-reduced-motion", /prefers-reduced-motion/.test(html));
ok("focus-visible odak halkasi", /:focus-visible/.test(html));
ok("aria-pressed mod dugmeleri", (html.match(/aria-pressed/g) || []).length >= 4);
ok("role=group mod seti", /role="group"/.test(html));
ok("canvas aria-label", /"aria-label", "Yildiz Inisi oyun sahnesi"/.test(html));
ok("resize dinleyicisi", /addEventListener\("resize"/.test(html));
ok("dokunmatik girdi", /addEventListener\("pointerdown"/.test(html));
ok("klavye girdisi", /addEventListener\("keydown"/.test(html));

/* 2. Mantik modulunu izole calistir */
const block = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>"));
const ctx = { window: {}, console, Math, Object, String, Number, Array, Buffer };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(block, ctx);
const YI = ctx.window.YI;
ok("YI global olarak yayimlandi", !!YI);
const C = YI.C;

ok("pist yarim genisligi", C.TRACK_HALF === 22);
ok("chunk uzunlugu", C.CHUNK_LEN === 40);
ok("baslangic hizi", C.BASE_SPEED === 14);
ok("azami hiz taban ustunde", C.MAX_SPEED > C.BASE_SPEED);
ok("can sayisi 3", C.MAX_HEALTH === 3);
ok("uc mod", C.MODES.length === 3 && C.MODES.join(",") === "gece,safak,tipi");
ok("dt tavani", C.MAX_DT === 0.05);
ok("yercekimi negatif", C.GRAVITY < 0);
ok("zipla hizi pozitif", C.JUMP_V > 0);
ok("yildiz yaricapi agactan buyuk", C.R_STAR > C.R_TREE);

ok("clamp alt sinir", YI.clamp(-5, 0, 1) === 0);
ok("clamp ust sinir", YI.clamp(5, 0, 1) === 1);
ok("clamp orta", YI.clamp(0.4, 0, 1) === 0.4);
ok("lerp basi", YI.lerp(2, 10, 0) === 2);
ok("lerp sonu", YI.lerp(2, 10, 1) === 10);
ok("lerp ortasi", YI.lerp(0, 10, 0.5) === 5);
ok("lerp t kelepcelenir", YI.lerp(0, 10, 3) === 10);

const r1 = YI.makeRng(42), r2 = YI.makeRng(42), r3 = YI.makeRng(43);
const s1 = [r1(), r1(), r1()], s2 = [r2(), r2(), r2()], s3 = [r3(), r3(), r3()];
ok("rng deterministik", s1.join() === s2.join());
ok("rng tohuma duyarli", s1.join() !== s3.join());
ok("rng 0..1 araliginda", s1.every((v) => v >= 0 && v < 1));
ok("rng sabit degil", new Set(s1).size === 3);
ok("hashSeed kararli", YI.hashSeed("yildiz") === YI.hashSeed("yildiz"));
ok("hashSeed ayirt eder", YI.hashSeed("yildiz") !== YI.hashSeed("yildiz "));
ok("hashSeed 32 bit", YI.hashSeed("abc") >= 0 && YI.hashSeed("abc") <= 0xFFFFFFFF);

ok("zemin baslangicta sifira yakin", Math.abs(YI.groundHeight(0, 0)) < 2);
ok("yamac asagi iner", YI.groundHeight(0, -400) > YI.groundHeight(0, 0));
ok("zemin deterministik", YI.groundHeight(3, -17) === YI.groundHeight(3, -17));
ok("zemin x ile degisir", YI.groundHeight(0, -50) !== YI.groundHeight(9, -50));
ok("egim sonlu", Number.isFinite(YI.groundSlope(2, -30)));

ok("zorluk basta 0", YI.difficultyAt(0) === 0);
ok("zorluk 1400 metrede 1", YI.difficultyAt(1400) === 1);
ok("zorluk kelepcelenir", YI.difficultyAt(99999) === 1);
ok("zorluk monoton", YI.difficultyAt(300) < YI.difficultyAt(900));
ok("hiz tavani artar", YI.speedCap(0) < YI.speedCap(1400));
ok("hiz tavani sinirli", YI.speedCap(99999) === C.MAX_SPEED);

const c0 = YI.generateChunk("s", 0);
const c5a = YI.generateChunk("s", 5);
const c5b = YI.generateChunk("s", 5);
const c5c = YI.generateChunk("t", 5);
ok("ilk chunk engelsiz", c0.entities.filter((e) => e.kind === "tree" || e.kind === "rock").length === 0);
ok("ilk chunk yildizli", c0.entities.some((e) => e.kind === "star"));
ok("chunk deterministik", JSON.stringify(c5a) === JSON.stringify(c5b));
ok("chunk tohuma duyarli", JSON.stringify(c5a) !== JSON.stringify(c5c));
ok("chunk z0 dogru", c5a.z0 === -200);
ok("varliklar pist icinde", c5a.entities.every((e) => Math.abs(e.x) <= C.TRACK_HALF));
ok("varliklar chunk araliginda", c5a.entities.every((e) => e.z <= c5a.z0 && e.z >= c5a.z0 - C.CHUNK_LEN));
ok("kimlikler benzersiz", new Set(c5a.entities.map((e) => e.id)).size === c5a.entities.length);
ok("her ucuncu chunkta kapi", YI.generateChunk("s", 6).entities.some((e) => e.kind === "gate"));
ok("kapisiz chunk", !YI.generateChunk("s", 7).entities.some((e) => e.kind === "gate"));
ok("zorluk engel sayisini artirir",
  YI.generateChunk("s", 40).entities.filter((e) => e.kind === "tree" || e.kind === "rock").length >=
  YI.generateChunk("s", 2).entities.filter((e) => e.kind === "tree" || e.kind === "rock").length);
ok("chunkIndexForZ sifir", YI.chunkIndexForZ(0) === 0);
ok("chunkIndexForZ negatif z", YI.chunkIndexForZ(-85) === 2);
ok("chunkIndexForZ pozitif z kelepcelenir", YI.chunkIndexForZ(50) === 0);

const st = YI.createState("test", "gece");
ok("baslangic fazi ready", st.phase === "ready");
ok("baslangic puani 0", st.score === 0);
ok("baslangic cani dolu", st.health === C.MAX_HEALTH);
ok("baslangic komboso 1", st.combo === 1);
ok("baslangic hizi taban", st.speed === C.BASE_SPEED);
ok("baslangicta havada degil", st.airborne === false);
ok("baslangic modu gece", st.mode === "gece");
ok("gecersiz mod gece olur", YI.createState("t", "yaz").mode === "gece");
ok("setMode calisir", YI.setMode(YI.createState("t"), "tipi").mode === "tipi");
ok("setMode gecersizi reddeder", YI.setMode(YI.createState("t"), "yok").mode === "gece");
ok("start fazi degistirir", YI.start(YI.createState("t")).phase === "playing");
ok("duraklat", YI.togglePause(YI.start(YI.createState("t"))).phase === "paused");
ok("devam et", YI.togglePause(YI.togglePause(YI.start(YI.createState("t")))).phase === "playing");
ok("ready durumunda duraklatma yok", YI.togglePause(YI.createState("t")).phase === "ready");
ok("visibleChunks ureti", YI.visibleChunks(YI.createState("t")).length >= 5);

/* 3. Fizik */
function fresh() { const s = YI.createState("fizik"); return YI.start(s); }
let p = fresh();
YI.stepPlayer(p, {}, 0.05);
ok("ileri hareket", p.z < 0);
ok("mesafe artar", p.distance > 0);
ok("zaman ilerler", p.time === 0.05);
ok("hiz artar", p.speed > C.BASE_SPEED);
ok("bosta yatay kayma yok", Math.abs(p.vx) < 1e-9);
near("bir adimda kat edilen yol", -p.z, 0.7, 0.02);

p = fresh();
for (let i = 0; i < 20; i++) { YI.stepPlayer(p, { right: true }, 0.05); }
ok("saga donus", p.x > 0);
ok("yatay hiz sinirli", Math.abs(p.vx) <= C.LATERAL_MAX);
const xr = p.x;
for (let i = 0; i < 200; i++) { YI.stepPlayer(p, { right: true }, 0.05); }
ok("pist sag sinirinda durur", p.x <= C.TRACK_HALF);
ok("sag sinira ulasildi", p.x > xr);

p = fresh();
for (let i = 0; i < 200; i++) { YI.stepPlayer(p, { left: true }, 0.05); }
ok("pist sol sinirinda durur", p.x >= -C.TRACK_HALF);

p = fresh();
YI.stepPlayer(p, { right: true }, 0.05);
const vxPeak = p.vx;
for (let i = 0; i < 10; i++) { YI.stepPlayer(p, {}, 0.05); }
ok("surtunme yatay hizi soncurur", Math.abs(p.vx) < Math.abs(vxPeak));

p = fresh();
YI.stepPlayer(p, { jump: true }, 0.016);
ok("zipla havalandirir", p.airborne === true);
ok("zipla yukselti verir", p.y > 0);
const yAir = p.y;
YI.stepPlayer(p, { jump: true }, 0.016);
ok("havada ikinci zipla yok", p.vy < C.JUMP_V);
let guard = 0;
while (p.airborne && guard++ < 500) { YI.stepPlayer(p, {}, 0.016); }
ok("yercekimi yere indirir", p.airborne === false && p.y === 0);
ok("inis sonrasi dikey hiz sifir", p.vy === 0);
ok("ziplama tepe noktasi vardi", yAir > 0);

p = fresh();
const scoreBefore = p.score;
YI.stepPlayer(p, {}, 0.05);
ok("mesafe puani birikir", p.score > scoreBefore);
p = fresh();
YI.stepPlayer(p, {}, 10);
ok("dt tavani uygulanir", p.time === C.MAX_DT);

/* 4. Carpisma ve skor */
p = fresh();
const tree = { kind: "tree", x: 0, z: 0, scale: 1, id: "t1" };
ok("uzerindeki agac carpar", YI.hits(p, tree) === true);
ok("uzak agac carpmaz", YI.hits(p, { kind: "tree", x: 12, z: 0, scale: 1, id: "t2" }) === false);
ok("yildiz yaricapi genis", YI.hits(p, { kind: "star", x: 2, z: 0, scale: 1, id: "s1" }) === true);
ok("kapi yaricapi dar", YI.hits(p, { kind: "gate", x: 2, z: 0, scale: 1, id: "g1" }) === false);

p = fresh();
YI.resolveCollisions(p, [{ kind: "star", x: 0, z: 0, scale: 1, id: "s1" }]);
ok("yildiz toplandi", p.stars === 1);
ok("kombo yukseldi", p.combo === 2);
ok("yildiz puani eklendi", p.score === C.STAR_POINTS * 2);
YI.resolveCollisions(p, [{ kind: "star", x: 0, z: 0, scale: 1, id: "s1" }]);
ok("ayni yildiz iki kez sayilmaz", p.stars === 1);
for (let i = 0; i < 20; i++) { YI.resolveCollisions(p, [{ kind: "star", x: 0, z: 0, scale: 1, id: "sx" + i }]); }
ok("kombo tavani", p.combo === C.MAX_COMBO);

p = fresh();
YI.resolveCollisions(p, [{ kind: "gate", x: 0, z: 0, scale: 1, id: "g1" }]);
ok("kapi gecildi", p.gates === 1);
ok("kapi puani", p.score === C.GATE_POINTS);
ok("kapi komboyu degistirmez", p.combo === 1);

p = fresh();
p.combo = 5;
YI.resolveCollisions(p, [tree]);
ok("carpma cani dusurur", p.health === C.MAX_HEALTH - 1);
ok("carpma sayaci", p.crashes === 1);
ok("carpma komboyu sifirlar", p.combo === 1);
ok("carpma dokunulmazlik verir", p.invuln === C.INVULN_TIME);
ok("carpma oyunu bitirmez", p.phase === "playing");
YI.resolveCollisions(p, [{ kind: "tree", x: 0, z: 0, scale: 1, id: "t2" }]);
ok("dokunulmazlik ikinci carpmayi engeller", p.health === C.MAX_HEALTH - 1);

p = fresh();
for (let i = 0; i < 3; i++) {
  p.invuln = 0;
  YI.resolveCollisions(p, [{ kind: "tree", x: 0, z: 0, scale: 1, id: "k" + i }]);
}
ok("uc carpma oyunu bitirir", p.phase === "over");
ok("can sifir", p.health === 0);
ok("en iyi skor kaydedildi", p.best === p.score);
const evs = YI.drainEvents(p);
ok("olaylar yayimlandi", evs.some((e) => e.type === "crash") && evs.some((e) => e.type === "over"));
ok("olay kuyrugu bosaldi", p.events.length === 0);

p = fresh();
p.airborne = true;
YI.resolveCollisions(p, [tree]);
ok("havadayken agac carpmaz", p.health === C.MAX_HEALTH);

p = fresh();
p.speed = 40;
p.invuln = 0;
YI.resolveCollisions(p, [tree]);
ok("carpma hizi keser", p.speed < 40);
ok("hiz taban altina dusmez", p.speed >= C.BASE_SPEED);

const over = YI.createState("t"); over.phase = "over"; over.score = 900;
const again = YI.restart(over);
ok("yeniden baslat oynatir", again.phase === "playing");
ok("yeniden baslat puani sifirlar", again.score === 0);
ok("yeniden baslat cani doldurur", again.health === C.MAX_HEALTH);
ok("yeniden baslat en iyiyi korur", again.best === 900);
ok("yeniden baslat modu korur", YI.restart(YI.setMode(over, "tipi")).mode === "tipi");
ok("yeniden baslat toplananlari temizler", Object.keys(again.taken).length === 0);

const paused = YI.createState("t"); paused.phase = "paused";
const zP = paused.z;
YI.tick(paused, { right: true }, 0.05, []);
ok("durakken tick islemez", paused.z === zP);
const ready = YI.createState("t");
YI.tick(ready, {}, 0.05, []);
ok("ready durumunda tick islemez", ready.score === 0);

/* 5. Oynanabilirlik. Yonlendirmesiz inis makul surede biter. */
function sim(steer) {
  const s = YI.start(YI.createState("oyun-" + steer));
  let n = 0;
  while (s.phase === "playing" && n < 6000) {
    const ents = [];
    YI.visibleChunks(s).forEach((c) => c.entities.forEach((e) => ents.push(e)));
    const dir = steer ? Math.sin(n * 0.03) : 0;
    YI.tick(s, { left: dir < -0.3, right: dir > 0.3 }, 1 / 60, ents);
    n++;
  }
  return s;
}
const passive = sim(false);
ok("pasif inis en az 10 saniye surer", passive.time > 10 || passive.phase === "playing");
ok("pasif inis mesafe uretir", passive.distance > 150);
const active = sim(true);
ok("aktif inis puan toplar", active.score > 100);
ok("aktif inis yildiz toplar", active.stars > 0);
ok("simulasyon donmuyor", passive.time < 200 && active.time < 200);

const out = failures.length === 0;
console.log((out ? "PASS" : "FAIL") + " " + passed + " assertion");
if (!out) { failures.forEach((f) => console.log("  x " + f)); process.exit(1); }
