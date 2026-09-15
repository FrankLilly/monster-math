// Records every spelling-game line with a macOS voice into audio/*.m4a
// and writes audio/clips.js (text -> file). Re-run after changing SPELL_WORDS.
//   node make_audio.mjs                  (uses the best Premium/Enhanced English voice installed)
//   node make_audio.mjs "Zoe (Premium)"  (pick a voice by name)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const dir = import.meta.dirname + '/';
const src = readFileSync(dir + 'app.js', 'utf8');
const start = src.indexOf('/* ===== Spelling rounds'), end = src.indexOf('let spRun=null;');
if (start < 0 || end < 0) throw new Error('Could not find the spelling section in app.js.');
const ctx = {};
vm.runInNewContext(src.slice(start, end) + ';this.lines=spAllLines();', ctx);

const voices = execFileSync('say', ['-v', '?'], { encoding: 'utf8' }).split('\n')
  .map(l => l.match(/^(.+?)\s{2,}(en_\w+)/)).filter(Boolean).map(m => ({ name: m[1].trim(), lang: m[2] }));
const wanted = process.argv[2];
const voice = wanted ? voices.find(v => v.name === wanted)
  : voices.find(v => /Premium/.test(v.name) && v.lang === 'en_US') || voices.find(v => /Premium/.test(v.name))
  || voices.find(v => /Enhanced/.test(v.name) && v.lang === 'en_US');
if (!voice) {
  console.error(wanted ? `Voice "${wanted}" is not installed.` :
    'No Premium or Enhanced English voice is installed.\nDownload one: System Settings → Accessibility → Spoken Content → System voice → Manage Voices… → English → e.g. "Ava (Premium)".');
  process.exit(1);
}
console.log(`Recording ${ctx.lines.length} lines with ${voice.name}…`);

const out = dir + 'audio/';
mkdirSync(out, { recursive: true });
const map = {};
for (const text of ctx.lines) {
  const id = createHash('sha1').update(voice.name + '\n' + text).digest('hex').slice(0, 12);
  map[text] = id + '.m4a';
  if (existsSync(out + id + '.m4a')) continue;
  const aiff = out + id + '.aiff';
  execFileSync('say', ['-v', voice.name, '-r', '165', '-o', aiff, text.replaceAll(' | ', ' [[slnc 450]] ')]);
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', aiff, out + id + '.m4a']);
  rmSync(aiff);
}
const keep = new Set(Object.values(map));
for (const f of readdirSync(out)) if (f.endsWith('.m4a') && !keep.has(f)) rmSync(out + f);
writeFileSync(out + 'clips.js', `window.AUDIO_CLIPS=${JSON.stringify(map, null, 1)};\n`);
console.log(`Done: ${keep.size} clips in audio/.`);
