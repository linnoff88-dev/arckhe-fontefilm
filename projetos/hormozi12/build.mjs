#!/usr/bin/env node
// Mini-fontefilm: gera painéis (flux2-klein) + narração (ARCKHÉvox), monta trilha e emite movie spec pixflow.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DIR = new URL(".", import.meta.url).pathname;
const FLUX = process.env.FLUX_URL || "http://localhost:8000/generate";
const TTS = process.env.ARCKHÉVOX_TTS_URL || "http://127.0.0.1:7860";
const VOICE = process.env.VOICE || "bella";

const cfg = JSON.parse(readFileSync(DIR + "panels.json", "utf8"));
for (const d of ["img", "txt", "audio"]) mkdirSync(DIR + d, { recursive: true });

const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
const ffprobe = (f) =>
  parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nk=1:nw=1", f]).toString().trim());

async function flux(p) {
  const body = {
    model: "flux2-klein", prompt: `${p.prompt}, ${cfg.style}`,
    negative_prompt: cfg.negative, steps: cfg.steps,
    width: cfg.width, height: cfg.height, guidance_scale: 1.0, true_cfg_scale: 4.0, seed: p.seed,
  };
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(FLUX, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      return Buffer.from(j.image, "base64");
    } catch (e) { console.log(`  flux retry ${a} (${p.id}): ${e.message}`); if (a === 3) throw e; await new Promise(s => setTimeout(s, 2000)); }
  }
}

async function tts(text, out) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(`${TTS}/tts/vc`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: VOICE, lang: "pt", bitrate: "128k" }) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const mp3 = Buffer.from(await r.arrayBuffer());
      const tmp = out.replace(/\.wav$/, ".mp3");
      writeFileSync(tmp, mp3);
      sh("ffmpeg", ["-y", "-i", tmp, "-ar", "44100", "-ac", "1", out]);
      return;
    } catch (e) { console.log(`  tts retry ${a}: ${e.message}`); if (a === 3) throw e; await new Promise(s => setTimeout(s, 1500)); }
  }
}

const PAD = 0.5;   // silêncio entre falas (s)
const XFADE = 0.5; // duração do crossfade — compensada na duração da cena p/ não dessincronizar
const scenes = [];
const padded = [];

for (const p of cfg.panels) {
  const img = `${DIR}img/${p.id}.png`;
  const wav = `${DIR}audio/${p.id}.wav`;
  const pwav = `${DIR}audio/${p.id}.pad.wav`;

  if (!existsSync(img)) { process.stdout.write(`[img] ${p.id}… `); writeFileSync(img, await flux(p)); console.log("ok"); }
  else console.log(`[img] ${p.id} (cache)`);

  writeFileSync(`${DIR}txt/${p.id}.txt`, p.narr);
  if (!existsSync(wav)) { process.stdout.write(`[tts] ${p.id}… `); await tts(p.narr, wav); console.log("ok"); }
  else console.log(`[tts] ${p.id} (cache)`);

  // pad de silêncio no fim
  sh("ffmpeg", ["-y", "-i", wav, "-af", `apad=pad_dur=${PAD}`, pwav]);
  const dur = Math.round((ffprobe(pwav)) * 100) / 100;
  padded.push(pwav);

  const cam = { type: p.camera, intensity: 0.55, easing: "easeInOut" };
  if (p.direction) cam.direction = p.direction;
  // +XFADE compensa o overlap do crossfade (cada transição "come" 0.5s do vídeo)
  scenes.push({ id: p.id, image: p.id, duration: Math.round((dur + XFADE) * 100) / 100, camera: cam });
}

// concat narração
const list = `${DIR}audio/_concat.txt`;
writeFileSync(list, padded.map(f => `file '${f}'`).join("\n"));
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", `${DIR}audio/narration.wav`]);
const total = Math.round(scenes.reduce((s, x) => s + x.duration, 0) * 10) / 10;

// movie spec (YAML manual, simples)
const y = [];
y.push("schema: pixflow.movie/v1");
y.push('meta:');
y.push('  title: "12 Leis do Crescimento"');
y.push('  author: "fontefilm"');
y.push("output:");
y.push("  resolution: 1920x1080");
y.push("  fps: 30");
y.push("  filename: hormozi12.mp4");
y.push("defaults:");
y.push("  look: cARCKHÉ-dramatico");
y.push("  transition_out: { type: crossfade, duration: 0.5 }");
y.push("audio:");
y.push("  track: audio/narration.wav");
y.push("  volume: 1");
y.push("assets:");
y.push("  images:");
for (const p of cfg.panels) y.push(`    - { id: ${p.id}, file: img/${p.id}.png }`);
y.push("scenes:");
for (const s of scenes) {
  const c = s.camera;
  const camStr = `{ type: ${c.type}, intensity: ${c.intensity}, easing: ${c.easing}${c.direction ? `, direction: ${c.direction}` : ""} }`;
  y.push(`  - id: ${s.id}`);
  y.push(`    image: ${s.id}`);
  y.push(`    duration: ${s.duration}`);
  y.push(`    camera: ${camStr}`);
}
writeFileSync(`${DIR}hormozi12.movie.yaml`, y.join("\n") + "\n");
console.log(`\n✓ ${scenes.length} cenas, ${total}s total. Spec: hormozi12.movie.yaml`);
