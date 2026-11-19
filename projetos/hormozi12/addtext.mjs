#!/usr/bin/env node
// Camada de texto (Caminho 1): cartela + lower-third por lei, por cima do MP4 já renderizado.
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DIR = new URL(".", import.meta.url).pathname;
const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const ids = ["s0","s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13"];
const titulos = {
  s1:"01   Oferta âncora", s2:"02   Anuncie mais", s3:"03   Comece de graça",
  s4:"04   Prova > promessa", s5:"05   Suba os preços", s6:"06   Una vendas e marketing",
  s7:"07   Fale com clientes", s8:"08   Foco em marketing", s9:"09   10× no que funciona",
  s10:"10   Foco radical", s11:"11   Enfrente o difícil", s12:"12   Lembrar > ensinar",
};
mkdirSync(DIR + "txt", { recursive: true });
const ffprobe = (f) => parseFloat(execFileSync("ffprobe",
  ["-v","error","-show_entries","format=duration","-of","default=nk=1:nw=1",f]).toString().trim());

// starts a partir das durações com pad (sincronizadas com o vídeo)
let t = 0; const seg = {};
for (const id of ids) { const d = ffprobe(`${DIR}audio/${id}.pad.wav`); seg[id] = [t, t + d]; t += d; }

const tf = (name, txt) => { const p = `${DIR}txt/_t_${name}.txt`; writeFileSync(p, txt); return p; };
const F = [];
const enable = (a,b) => `enable='between(t,${a.toFixed(2)},${b.toFixed(2)})'`;

// cartela de abertura (durante s0)
{ const [a,b] = seg.s0;
  F.push(`drawbox=x=0:y=ih/2-110:w=iw:h=230:color=black@0.45:t=fill:${enable(a,b)}`);
  F.push(`drawtext=fontfile=${FONT}:textfile=${tf("title","12 LEIS DO CRESCIMENTO")}:fontcolor=white:fontsize=84:x=(w-tw)/2:y=h/2-90:${enable(a,b)}`);
  F.push(`drawtext=fontfile=${FONT}:textfile=${tf("sub","do Alex Hormozi")}:fontcolor=0xE2A23B:fontsize=42:x=(w-tw)/2:y=h/2+20:${enable(a,b)}`);
}
// lower-third por lei (s1..s12)
for (const id of Object.keys(titulos)) {
  const [a,b] = seg[id];
  F.push(`drawtext=fontfile=${FONT}:textfile=${tf(id,titulos[id])}:fontcolor=white:fontsize=50:x=70:y=h-150:box=1:boxcolor=0x121212@0.66:boxborderw=26:${enable(a,b)}`);
  F.push(`drawbox=x=70:y=h-156:w=10:h=86:color=0xE2A23B:t=fill:${enable(a,b)}`); // acento âmbar
}
// fecho (durante s13)
{ const [a,b] = seg.s13;
  F.push(`drawbox=x=0:y=ih/2-80:w=iw:h=160:color=black@0.45:t=fill:${enable(a,b)}`);
  F.push(`drawtext=fontfile=${FONT}:textfile=${tf("fim","Comece hoje.")}:fontcolor=white:fontsize=76:x=(w-tw)/2:y=h/2-45:${enable(a,b)}`);
}

const graph = F.join(",");
console.log(`segmentos: s1=${seg.s1.map(x=>x.toFixed(1))} … s13=${seg.s13.map(x=>x.toFixed(1))}`);
console.log("renderizando texto…");
execFileSync("ffmpeg", ["-y","-i",`${DIR}hormozi12.mp4`,"-vf",graph,
  "-c:v","libx264","-crf","18","-preset","medium","-c:a","copy",`${DIR}hormozi12-texto.mp4`],
  { stdio: ["ignore","inherit","inherit"] });
console.log("✓ hormozi12-texto.mp4");
