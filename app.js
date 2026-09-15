'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='monster-math-v1';
/* Monster Math: math and story-problem rounds only; rewards build the monster (no spelling, rooms or town). Saves on this device. */
const initial=()=>({name:'Lilly',level:'starter',stars:0,counts:{math:0,spelling:0,reading:0},design:{template:'monster',built:['body','face','feet'],color:'#78ad72',face:'happy',hat:'none',height:2,width:2},gallery:[],trials:[],rewarded:[]});
let state=initial();try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.design&&s.counts&&Array.isArray(s.gallery)&&Array.isArray(s.trials)&&Array.isArray(s.rewarded))state={...state,...s};}catch{}
if(!state.name)state.name='Lilly';
state.design.built=['body','face','feet'];
state.gallery.forEach(g=>g.design.built=['body','face','feet']);
if(state.activeGalleryIndex===undefined)state.activeGalleryIndex=state.gallery.findIndex(g=>g.name===state.activeBuddyName);
let pendingBuild=null;
let subject='math',question=null,letters=[],prediction=null,tested=false,toastTimer;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('.local').textContent='Progress saving unavailable';}}
function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',4000);}
const player=new Audio();let audioUnlocked=false;
document.addEventListener('pointerdown',()=>{if(audioUnlocked)return;audioUnlocked=true;player.onerror=null;player.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';player.play().catch(()=>{});},{capture:true});
function bestVoice(){const v=('speechSynthesis'in window)?speechSynthesis.getVoices().filter(x=>/^en/i.test(x.lang)):[];return v.find(x=>/premium/i.test(x.name))||v.find(x=>/enhanced/i.test(x.name))||v.find(x=>/samantha|ava|zoe/i.test(x.name))||null;}
function speak(t){player.pause();if('speechSynthesis'in window)speechSynthesis.cancel();const clip=window.AUDIO_CLIPS&&window.AUDIO_CLIPS[t];if(clip){player.src='audio/'+clip;player.onerror=()=>{player.onerror=null;speakVoice(t);};player.play().catch(e=>{if(e&&e.name!=='AbortError')speakVoice(t);});return;}speakVoice(t);}
function speakVoice(t){t=t.replaceAll(' | ',' ');if(!('speechSynthesis'in window)){toast('Read this one together. This browser has no read-aloud voice.');return;}const u=new SpeechSynthesisUtterance(t);const bv=bestVoice();if(bv)u.voice=bv;u.rate=.82;speechSynthesis.speak(u);}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const templates={
 monster:{name:'Monster',group:'Silly creatures',color:'#78ad72',icon:'👾',note:'A wonderfully weird friend. Make it your own!'},
 unicorn:{name:'Unicorn',group:'Magical friends',color:'#d6b3df',icon:'🦄',note:'A magical friend with a golden horn and a colorful mane.'},
 axolotl:{name:'Axolotl',group:'Exotic animals',color:'#e7a2b3',icon:'🫧',note:'An axolotl is a water animal with feathery gills beside its head.'},
 panda:{name:'Red panda',group:'Exotic animals',color:'#cf8762',icon:'🐾',note:'A red panda has a long, striped tail. Build a cozy forest friend!'},
 toucan:{name:'Toucan',group:'Exotic animals',color:'#607983',icon:'🪶',note:'A toucan is a bird with a big, colorful beak.'}
};
const upgrades={
 wings:{name:'Rainbow wings',prop:'wings',value:true,subject:'math'},
 crown:{name:'Golden crown',prop:'hat',value:'crown',subject:'spelling'},
 cape:{name:'Super cape',prop:'cape',value:true,subject:'reading'},
 star:{name:'Star belly',prop:'badge',value:true,subject:'math'},
 boots:{name:'Rocket boots',prop:'boots',value:true,subject:'spelling'},
 pink:{name:'Pink sparkle',prop:'sparkle',value:true,subject:'reading'}
};
function featurePicker(){
 $('#featureGrid').innerHTML=Object.entries(upgrades).map(([id,f])=>{
 const owned=state.design[f.prop]===f.value;
 return `<button data-feature="${id}" ${owned?'disabled':''}>${monster({...state.design,[f.prop]:f.value})}<strong>${f.name}</strong><span>${owned?'✓ Added!':'Pick me →'}</span></button>`;
 }).join('');
}
function monster(d,environment='plain'){
 const kind=templates[d.template]?d.template:'monster';
 const built=d.built||['body','face','feet'];
 const bodyOpacity=built.includes('body')?1:.15,feetOpacity=built.includes('feet')?1:.15;
 const h=70+d.height*19,y=246-h,feet=23+d.width*12,c=d.color;
 const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
 let backdrop=`<ellipse cx="200" cy="285" rx="111" ry="17" fill="#b4c39e" opacity=".4"/><path d="M80 268 200 225 321 268 201 315Z" fill="#b1ca8c"/><path d="M80 268 201 310 201 326 80 283Z" fill="#8fa875"/><path d="M201 310 321 268 321 283 201 326Z" fill="#9eb97f"/><path d="m105 277 120-43m-92 53 119-43m-91 53 119-43M107 259l120 43m-91-54 120 44m-91-54 120 44" stroke="#d7e4b7" opacity=".5"/>`;
 if(environment==='reach')backdrop+=`<path d="M310 273V105H262" fill="none" stroke="#9d825e" stroke-width="12"/><circle cx="262" cy="122" r="14" fill="#d97758"/><path d="m262 108 6-10" stroke="#477148" stroke-width="5"/>`;
 if(environment==='tunnel')backdrop+=`<path d="M90 270V131H307V270" fill="none" stroke="#9faeaf" stroke-width="20"/><path d="M90 139H307" stroke="#788d8b" stroke-width="8"/>`;
 const eyeY=y+28;
 let eyes=rect(160,eyeY,23,26,'#fffbed')+rect(211,eyeY,23,26,'#fffbed')+rect(170,eyeY+8,10,14,'#263e36')+rect(214,eyeY+8,10,14,'#263e36');
 if(d.face==='cyclops')eyes=rect(177,eyeY-2,41,32,'#fffbed')+rect(193,eyeY+5,14,21,'#263e36');
 if(d.face==='sleepy')eyes=`<path d="M158 ${eyeY+17}h26m26 0h26" stroke="#263e36" stroke-width="7"/>`;
 let features='',behind='';
 if(kind==='unicorn'){
 behind=`<path d="M253 ${y+12}h22v${h-3}h-30" fill="#ae8dcc"/><path d="M269 ${y+24}h13v${h-12}" stroke="#e8aabd" stroke-width="12"/><path d="M249 228h30v29h-15v-14h-15" fill="#ae8dcc"/>`;
 features=`<path d="M185 ${y}l14-47 14 47Z" fill="#edc961"/><path d="m191 ${y-17} 15-6m-11-7 8-3" stroke="#fff0b4" stroke-width="4"/><path d="M149 ${y}v-25l23 25m55 0 22-25v25" fill="#e4cbea"/><path d="M161 ${y+8}h67v12h-67Z" fill="#e8aabd"/>`;
 }
 if(kind==='axolotl'){
 behind=`<path d="M145 ${y+27}h-28l-15-22m40 36h-41m43 14h-27l-15 22M254 ${y+27}h28l15-22m-41 36h41m-43 14h27l15 22" stroke="#c97090" stroke-width="11" fill="none"/>`;
 }
 if(kind==='panda'){
 behind=`<path d="M246 231h42v-54h27v81h-69Z" fill="#ba7151"/><path d="M288 188h27m-27 23h27m-27 24h27" stroke="#efd0ab" stroke-width="10"/>`;
 features=`<path d="M144 ${y+2}v-31h27v31m57 0v-31h27v31" fill="#f7e4cb"/><path d="M151 ${y-5}v-16h13v16m71 0v-16h13v16" fill="#604c46"/><path d="M151 ${eyeY-4}h34v10h-34m58 0v-10h34v10" fill="#f7e4cb"/><path d="M174 ${eyeY+34}h46v24h-46" fill="#f7e4cb"/>`;
 }
 if(kind==='toucan'){
 behind=`<path d="M141 ${y+55}h-22v64h22m114-64h22v64h-22" fill="#3b535e"/>`;
 features=`<path d="M162 ${eyeY+31}h70v${Math.max(25,h-64)}h-70Z" fill="#f5e4ad"/><path d="M190 ${eyeY+32}h86v29h-86Z" fill="#edb847"/><path d="M250 ${eyeY+32}h26v29h-26Z" fill="#df8652"/><path d="M190 ${eyeY+50}h86" stroke="#b1763f" stroke-width="3"/>`;
 }
 if(d.cape)behind+=`<path d="M142 ${y+45}h112l42 117-98-23-93 23Z" fill="#cc6c84"/><path d="M155 ${y+49}l-17 90m103-90 20 90" stroke="#eb9fae" stroke-width="5"/>`;
 if(d.wings)behind+=`<path d="M147 ${y+54} 72 ${y+12}l12 74 60 15m110-47 75-42-12 74-60 15" fill="#b192d8"/><path d="m145 ${y+64}-55-29 9 43 45 15m112-29 55-29-9 43-45 15" fill="#f0acbe"/><path d="m145 ${y+75}-35-14 8 20 26 11m111-17 35-14-8 20-26 11" fill="#f3d374"/>`;
 let hat='';if(d.hat==='horns')hat=rect(150,y-24,18,29,'#f4d387')+rect(226,y-24,18,29,'#f4d387')+rect(156,y-33,12,12,'#f8e5b5')+rect(226,y-33,12,12,'#f8e5b5');
 if(d.hat==='sprout')hat=`<path d="M198 ${y}v-24" stroke="#49714c" stroke-width="7"/><path d="M198 ${y-16}q-31 0-25-21 27 0 25 21m0-4q28 0 24-20-26 0-24 20" fill="#6e9b54"/>`;
 if(d.hat==='crown')hat=`<path d="M159 ${y}v-30l20 14 18-23 19 23 20-14v30Z" fill="#edbc4b"/>`;
 return `<svg viewBox="0 0 400 340" role="img" aria-label="${templates[kind].name} with height ${d.height} and feet width ${d.width}">${backdrop}<g><g opacity="${bodyOpacity}">${behind}</g><g opacity="${feetOpacity}">${rect(149,235,30,30,'#4b7650')}${rect(218,235,30,30,'#4b7650')}${rect(174-feet,258,feet,17,c)}${rect(218,258,feet,17,c)}</g><g opacity="${bodyOpacity}">${rect(121,y+51,23,49,c)}${rect(253,y+51,23,49,c)}${rect(143,y,110,h,c)}<path d="M143 ${y}l14-10h110l-14 10Z" fill="#a2cb89"/><path d="M253 ${y}l14-10v${h}l-14 10Z" fill="#42674d" opacity=".5"/>${rect(153,y+9,12,10,'#ffffff25')}${features}${hat}</g><g opacity="${built.includes('face')?1:0}">${eyes}<path d="M183 ${eyeY+39}v8h30v-8" stroke="#263e36" stroke-width="6" fill="none"/>${rect(155,eyeY+32,14,7,'#edb2a0')}${rect(226,eyeY+32,14,7,'#edb2a0')}</g><g opacity="${bodyOpacity}">${rect(176,y+h-27,11,10,'#ffffff30')}${rect(199,y+h-27,11,10,'#ffffff30')}</g>${d.badge?`<path d="m198 ${y+h-39} 6 13 15 2-11 10 3 15-13-7-13 7 3-15-11-10 15-2Z" fill="#f7d15e" stroke="#b78b34" stroke-width="2"/>`:''}${d.boots?`<path d="M${174-feet} 255h${feet}v20h-${feet}Zm${44+feet} 0h${feet}v20h-${feet}Z" fill="#9b87cc"/><path d="m150 276 5 17 5-17m68 0 5 17 5-17" stroke="#f0a950" stroke-width="6"/>`:''}${d.sparkle?`<g fill="#ef91bc"><path d="m111 ${y-6} 5 14 14 5-14 5-5 14-5-14-14-5 14-5Zm170 20 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z"/><circle cx="113" cy="230" r="5"/><circle cx="287" cy="245" r="6"/></g>`:''}</g><g fill="#f8f9df"><path d="m91 145 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><path d="m304 193 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/></g></svg>`;
}
function update(){
 const kind=templates[state.design.template]||templates.monster;
 const count=(state.design.built||['body','face','feet']).length;
 $('#activeCompanion').innerHTML=`<div class="companion-picture">${monster(state.design)}</div><div><strong>${escapeHTML(state.activeBuddyName||kind.name)} · ${count<3?'in the making':`${escapeHTML(state.name||'Your')}’s adventure buddy`}</strong><p>${count<3?`${count} of 3 parts built. Each learning quest brings your friend to life.`:'Your buddy joins you in learning quests and the test lab.'}</p></div><button class="quiet" data-go="gallery">Switch buddy ♡</button>`;
 $('#stars').textContent=state.stars;$('#welcome').textContent=`Hello, ${state.name||'inventor'}! Let’s make a wonderfully weird friend.`;$('#height').value=state.design.height;$('#width').value=state.design.width;$('#heightValue').textContent=state.design.height;$('#widthValue').textContent=state.design.width;for(const prop of ['height','width']){const out=$('#'+prop+'Steps');if(out)out.textContent=state.design[prop]+(state.design[prop]===1?' block':' blocks');$$('[data-step="'+prop+'"]').forEach(b=>b.disabled=Number(b.dataset.delta)<0?state.design[prop]<=1:state.design[prop]>=(prop==='height'?4:3));}$('#scene').innerHTML=monster(state.design);toolbox();featurePicker();persist();}
function requestBuild(prop,value,slot,area){
 pendingBuild={prop,value,slot,subject:area};subject=area;newQuestion();go('learn');
}
function finishBuild(){
 if(!pendingBuild)return false;
 const b=pendingBuild;question.featureName=b.name||'New feature';if(b.prop)state.design[b.prop]=b.value;
 state.design.built=[...new Set([...(state.design.built||['body','face','feet']),b.slot])];
 if(Number.isInteger(state.activeGalleryIndex)&&state.gallery[state.activeGalleryIndex])state.gallery[state.activeGalleryIndex].design={...state.design};pendingBuild=null;update();return true;
}
function toolbox(){
 const selected=state.design.template||'monster';
 $('#templates').innerHTML=Object.entries(templates).map(([id,t])=>`<button data-template="${id}" aria-pressed="${selected===id}" class="${selected===id?'selected':''}">${monster({template:id,color:t.color,face:'happy',hat:'none',height:2,width:2})}<strong>${t.name}</strong><span>${t.group}</span></button>`).join('');
 $('#templateNote').textContent=templates[selected]?.note||templates.monster.note;
 const built=state.design.built||['body','face','feet'];
 $('#buildSteps').innerHTML=[['body','🔢','Body','math'],['face','🔤','Face','spelling'],['feet','📖','Feet','reading']].map(([slot,icon,label,area])=>`<button data-build-slot="${slot}" data-area="${area}" ${built.includes(slot)?'disabled':''}>${built.includes(slot)?'✓':icon} ${label}<small>${built.includes(slot)?'Built!':area==='math'?'Solve a number quest':area==='spelling'?'Build a word':'Read a little story'}</small></button>`).join('');
 $('#buildInstruction').textContent=built.length<3?'Bring your buddy to life! Tap a part and finish a little learning quest.':'Your buddy is ready! Want a change? Pick it, then learn to build it.';
 $('#saveBuddy').disabled=built.length<3;
 
 $('#colors').innerHTML=['#78ad72','#a58cc5','#e7a072','#7cacc5','#d98da5'].map((c,i)=>`<button style="background:${c}" data-color="${c}" class="${state.design.color===c?'selected':''}" aria-label="${['Green','Purple','Orange','Blue','Pink'][i]} body" aria-pressed="${state.design.color===c}"></button>`).join('');
 $('#faces').innerHTML=[['happy','Happy'],['cyclops','One eye'],['sleepy','Sleepy']].map(([id,label])=>`<button data-face="${id}" class="${state.design.face===id?'selected':''}" aria-pressed="${state.design.face===id}">${label}</button>`).join('');
 $('#hats').innerHTML=[['none','None',0],['horns','Horns',0],['sprout','Sprout',3],['crown','Crown',6]].map(([id,label,cost])=>`<button data-hat="${id}" class="${state.design.hat===id?'selected':''}" aria-pressed="${state.design.hat===id}" ${false?'disabled':''}>${label}${''}</button>`).join('');
}
function go(tab){if(tab==='learn'&&!pendingBuild&&(!question||!question.buildReward)){tab='build';}document.body.classList.toggle('doing-quest',tab==='learn');$$('.page').forEach(e=>e.classList.toggle('active',e.id===tab));$$('nav button').forEach(e=>{e.classList.toggle('active',e.dataset.tab===tab);e.setAttribute('aria-current',e.dataset.tab===tab?'page':'false');});if(tab==='learn'&&!question)newQuestion();if(tab==='lab')renderLab();if(tab==='gallery')gallery();if(tab==='spell')renderSpell();document.body.classList.toggle('on-spell',tab==='spell');if('speechSynthesis'in window)speechSynthesis.cancel();window.scrollTo({top:0,behavior:'instant'});}
const words=[['cat','🐱','A pet that says meow.'],['sun','☀️','It lights up the day.'],['dog','🐶','A pet that barks.'],['hat','🎩','You wear it on your head.'],['bug','🐞','A tiny animal with six legs.'],['pig','🐷','A farm animal that oinks.'],['map','🗺️','It helps you find your way.'],['cup','🥤','You drink from it.'],['bed','🛏️','You sleep in it.'],['fox','🦊','An animal with a bushy tail.']];
const stories=[
 ['Pip builds a tower. It falls over. Pip makes the bottom wider. Now it stands!','What helped the tower stand?',['A wider bottom','A new color','A louder voice'],0,'Pip changed the bottom of the tower.'],
 ['Moss sees a puddle. She puts on her boots. Then she splashes in the water.','Why does Moss put on boots?',['To keep her feet dry','To go to sleep','To eat lunch'],0,'Think about what happens when feet get wet.'],
 ['Dot has a red block and a blue block. She puts the blue block on top of the red block.','Which block is on the bottom?',['The red block','The blue block','A green block'],0,'The blue block is on top of another block.'],
 ['Bim plants a seed. He gives it water. A little green leaf grows.','What happens after Bim waters the seed?',['A leaf grows','The seed runs away','It turns into a rock'],0,'Look at the last thing that happens.'],
 ['A toy rolls off Nib’s bridge. Nib adds a low wall on each side. The toy stays on the bridge.','Why does Nib add walls?',['To stop the toy falling','To make the toy fly','To hide the bridge'],0,'Think about the problem Nib wanted to solve.'],
 ['Lulu wants to carry three blocks. Her paper bag rips. She tries a strong box and carries them home.','What could Lulu use next time?',['A strong box','The ripped bag','A small leaf'],0,'Which design worked when she tested it?']
];
function shuffle(a){return a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.v);}
function newQuestion(){letters=[];const n=state.counts[subject],stretch=state.level==='stretch';
 if(subject==='math'){const max=stretch?10:5,total=2+Math.floor(Math.random()*(max-1)),a=1+Math.floor(Math.random()*(total-1)),b=total-a,minus=n%2===1,answer=minus?b:total;question={title:minus?`You have ${total} blocks. Take away ${a}. How many are left?`:`You have ${a} blocks. Add ${b} more. How many now?`,visual:minus?`${'■'.repeat(total)} − ${'■'.repeat(a)}`:`${'■'.repeat(a)} + ${'■'.repeat(b)}`,answer:String(answer),choices:shuffle([...new Set([answer,answer+1,Math.max(0,answer-1)])]).map(String),hint:minus?'Count the blocks. Cover the ones you take away, then count what is left.':'Count the first group. Keep counting as you point to the second group.'};}
 if(subject==='spelling'){const w=words[n%words.length];question={title:`Build the word: ${w[0]}`,word:w[0],emoji:w[1],hint:w[2],choices:shuffle([...w[0],...(stretch?['e','r']:[])])};}
 if(subject==='reading'){const s=stories[n%stories.length];question={story:s[0],title:s[1],choices:shuffle(s[2]),answer:s[2][s[3]],hint:s[4]};}
 question.done=false;renderQuestion();}
function renderQuestion(){
 $$('[data-subject]').forEach(b=>b.classList.toggle('selected',b.dataset.subject===subject));
 $('#quest').innerHTML=`${pendingBuild?`<div class="build-reward"><strong>Let’s earn: ${pendingBuild.name||'a new feature'}</strong><span>Answer one question.</span></div>`:''}<button class="audio read" id="readQuest" aria-label="Read question aloud">◖)) Read to me</button><div class="eyebrow">${subject==='math'?'COUNT & DISCOVER':subject==='spelling'?'LETTER BY LETTER':'LOOK FOR CLUES'}</div>${question.story?`<p class="story">${question.story}</p>`:''}<h3>${subject==='spelling'?`${question.emoji} ${question.hint}`:question.title}</h3>${subject==='spelling'?`<p>Tap the letters to spell <strong>${state.level==='starter'?question.word:'the word for this picture'}</strong>.</p><div class="word-slots" aria-live="polite">${question.word.split('').map((_,i)=>letters[i]?.letter||'_').join('')}</div>`:question.visual?`<div class="counter-blocks" aria-hidden="true">${question.visual}</div>`:''}<div class="answers">${question.choices.map((c,i)=>`<button data-answer="${i}" ${letters.some(l=>l.index===i)?'disabled':''}>${c}</button>`).join('')}</div>${subject==='spelling'?'<button id="undoLetter" class="quiet">← Undo letter</button> ':''}<button id="hint" class="quiet">☀ A little hint</button><div class="feedback" role="status"></div><button id="nextQuestion" class="primary" hidden>Next little quest →</button>`;
 $('#readQuest').onclick=()=>speak(subject==='spelling'?`Spell ${question.word}. ${question.hint}`:`${question.story||''} ${question.title}`);
 $('#hint').onclick=()=>{const t=subject==='spelling'?`${question.hint} The word is ${question.word}. Start with ${question.word[0]}.`:question.hint;$('.feedback').textContent=t;speak(t);};
 $('#nextQuestion').onclick=()=>question.buildReward?go('build'):newQuestion();
 if($('#undoLetter'))$('#undoLetter').onclick=()=>{if(!question.done){letters.pop();renderQuestion();}};
}
function answer(i){if(question.done)return;let correct;
 if(subject==='spelling'){if(letters.length>=question.word.length){toast('Undo a letter to change your word.');return;}letters.push({index:i,letter:question.choices[i]});renderQuestion();if(letters.length<question.word.length)return;correct=letters.map(l=>l.letter).join('')===question.word;}else correct=question.choices[i]===question.answer;
 if(correct){question.done=true;question.buildReward=finishBuild();state.stars++;state.counts[subject]++;update();$('.feedback').textContent=`You did it! +1 discovery star. Your careful thinking paid off.`;$$('[data-answer]').forEach(b=>b.disabled=true);$('#nextQuestion').hidden=false;if(question.buildReward){$('#quest').innerHTML=`<div class="success-screen"><h2>You did it!</h2><div class="earned-preview">${monster(state.design)}</div><h3>${escapeHTML(question.featureName)} added!</h3><button class="primary" data-go="build">Pick another feature →</button><button class="quiet" data-go="lab">Play with my buddy →</button></div>`;}}else{$('.feedback').textContent='A good try! '+(subject==='spelling'?'Undo a letter, or use a hint and try again.':question.hint);}}
const experiments={balance:{title:'The wobble test',prompt:'Can your buddy stand steady? In our pretend lab, feet need to be at least half as wide as the body is tall.',check:d=>d.width*2>=d.height,reason:'Wider feet give a tall body more support.',change:'Try wider feet or a shorter body.'},reach:{title:'Reach the apple',prompt:'The apple is 3 blocks high. Can your buddy reach it? Feet can stay any width for this test.',check:d=>d.height>=3,reason:'A taller body can reach higher.',change:'Try a body that is 3 or 4 blocks tall.'},tunnel:{title:'Through the tunnel',prompt:'This tunnel fits a body up to 2 blocks tall and feet up to 2 blocks wide. Will your buddy fit?',check:d=>d.height<=2&&d.width<=2,reason:'Both height and width matter when a design needs to fit.',change:'Try a body no taller than 2 and feet no wider than 2.'}};
function renderLab(){prediction=null;tested=false;$$('[data-predict]').forEach(b=>b.disabled=false);const e=$('#experiment').value,d=state.design;$('#labTitle').textContent=experiments[e].title;$('#labPrompt').textContent=experiments[e].prompt;$('#designFacts').textContent=`Your design: ${d.height} blocks tall · feet ${d.width} blocks wide`;$('#labScene').innerHTML=monster(d,e);$('#labScene').classList.remove('wiggle');$('#labResult').textContent='';$('#test').disabled=true;$$('[data-predict]').forEach(b=>b.classList.remove('selected'));$('#labHistory').innerHTML='<strong>My test notebook</strong>'+ (state.trials.length?state.trials.slice(-4).reverse().map(t=>`<div>${escapeHTML(t.title)} · height ${t.height}, feet ${t.width} → ${t.pass?'Worked ✓':'Try a change ↻'}</div>`).join(''):'<p>Your discoveries will appear here.</p>');}
function test(){if(!prediction||tested)return;if((state.design.built||['body','face','feet']).length<3){toast('Build the body, face, and feet before testing your buddy.');go('build');return;}tested=true;const id=$('#experiment').value,e=experiments[id],pass=e.check(state.design);$('#test').disabled=true;$$('[data-predict]').forEach(b=>b.disabled=true);const accurate=(prediction==='yes')===pass;let result=`${pass?'It worked!':'We found something to change!'} ${accurate?'Your prediction matched the test.':'The test surprised us. That is a useful discovery!'} ${e.reason} ${pass?'Can you change one thing and predict what happens?':e.change}`;if(!state.rewarded.includes(id)){state.stars++;state.rewarded.push(id);result+=' +1 star for testing your idea!';}$('#labResult').textContent=result;if(!pass&&id==='balance')$('#labScene').classList.add('wiggle');state.trials.push({title:e.title,...state.design,pass});state.trials=state.trials.slice(-20);update();$('#labHistory').innerHTML='<strong>Notice & improve</strong><p>What happened? What one thing will you change? Tell your grown-up, then build and test again.</p>';}
function gallery(){$('#galleryGrid').innerHTML=state.gallery.length?state.gallery.map((g,i)=>`<article class="gallery-card">${monster(g.design)}<h3>${escapeHTML(g.name)}</h3><button data-load="${i}">Choose this buddy</button><button data-delete="${i}" aria-label="Delete ${escapeHTML(g.name)}">Delete</button></article>`).join(''):'<div class="panel"><h3>Your first friend is waiting!</h3><p>Build a buddy and tap “Save buddy” to put it here.</p><button class="primary" data-go="build">Start building →</button></div>';}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.feature){const f=upgrades[b.dataset.feature];pendingBuild={...f,slot:'body'};subject=f.subject;newQuestion();go('learn');}if(b.dataset.template){if(b.dataset.template===(state.design.template||'monster'))return;const t=templates[b.dataset.template];pendingBuild=null;state.activeGalleryIndex=null;state.activeBuddyName='';$('#buddyName').value='';state.design={template:b.dataset.template,color:t.color,face:'happy',hat:'none',height:2,width:2,built:['body','face','feet']};update();toast('Pick a cool feature for your '+t.name.toLowerCase()+'!');$('#friendChoices').open=false;}if(b.dataset.step){const prop=b.dataset.step;requestBuild(prop,Math.max(1,Math.min(prop==='height'?4:3,state.design[prop]+Number(b.dataset.delta))),prop==='height'?'body':'feet','math');}if(b.dataset.buildSlot)requestBuild(null,null,b.dataset.buildSlot,b.dataset.area);if(b.dataset.tab)go(b.dataset.tab);if(b.dataset.go)go(b.dataset.go);for(const prop of ['color','face','hat'])if(b.dataset[prop]){requestBuild(prop,b.dataset[prop],prop==='face'?'face':'body',prop==='face'?'spelling':prop==='hat'?'reading':'math');}if(b.dataset.subject){subject=b.dataset.subject;newQuestion();}if(b.dataset.answer!==undefined)answer(Number(b.dataset.answer));if(b.dataset.predict){prediction=b.dataset.predict;$$('[data-predict]').forEach(el=>el.classList.toggle('selected',el===b));$('#test').disabled=false;}if(b.dataset.load!==undefined){const g=state.gallery[Number(b.dataset.load)];pendingBuild=null;state.activeGalleryIndex=Number(b.dataset.load);state.activeBuddyName=g.name;state.design={...g.design};$('#buddyName').value=g.name;update();go('build');}if(b.dataset.delete!==undefined){if(confirm('Remove this buddy from your saved creations?')){const removed=Number(b.dataset.delete);state.gallery.splice(removed,1);if(state.activeGalleryIndex===removed)state.activeGalleryIndex=null;else if(state.activeGalleryIndex>removed)state.activeGalleryIndex--;persist();gallery();}}});
for(const prop of ['height','width'])$('#'+prop).onchange=e=>{const value=Number(e.target.value);e.target.value=state.design[prop];requestBuild(prop,value,prop==='height'?'body':'feet','math');};
$('#saveBuddy').onclick=()=>{if((state.design.built||['body','face','feet']).length<3){toast('Finish your three building quests first.');return;}if(state.gallery.length>=24){toast('Your shelf has 24 buddies! Remove one to make room.');return;}state.activeBuddyName=$('#buddyName').value.trim()||`Buddy ${state.gallery.length+1}`;state.gallery.push({name:state.activeBuddyName,design:{...state.design}});state.activeGalleryIndex=state.gallery.length-1;update();toast('Your buddy is saved in My creations!');};
$('#hearBuild').onclick=()=>speak('Pick a cool feature for your buddy. Answer one question. Watch your feature appear!');
$('#readLab').onclick=()=>speak($('#labPrompt').textContent+' '+$('#designFacts').textContent+' '+$('#labResult').textContent);
$('#experiment').onchange=renderLab;$('#test').onclick=test;
$('#grownups').onclick=()=>{$('#childName').value=state.name;$('#level').value=state.level;$('#progressSummary').textContent=`Completed quests: ${state.counts.math} math · ${state.counts.spelling} spelling · ${state.counts.reading} reading. Saved creations: ${state.gallery.length}.` ;$('#settings').showModal();};
$('#saveSettings').onclick=()=>{state.name=$('#childName').value.trim();state.level=$('#level').value;question=null;update();if($('#learn').classList.contains('active'))newQuestion();$('#settings').close();};
$('#reset').onclick=()=>{if(confirm('Reset all stars, saved buddies, and learning progress on this browser?')){state=initial();pendingBuild=null;question=null;update();$('#settings').close();go('build');toast('A fresh workshop is ready.');}};
for(const prop of ['height','width']){
const controls=document.createElement('div');controls.className='stepper';
controls.innerHTML=`<button data-step="${prop}" data-delta="-1" aria-label="Decrease ${prop==='height'?'body height':'feet width'}">−</button><output id="${prop}Steps" aria-live="polite"></output><button data-step="${prop}" data-delta="1" aria-label="Increase ${prop==='height'?'body height':'feet width'}">+</button>`;
$('#'+prop).insertAdjacentElement('afterend',controls);
}
update();
/* ===== Spelling rounds: spell a word → pick a monster part → keep building. =====
   This week's list (Classroom News 9/14–9/18). To change the list, edit SPELL_WORDS.
   type: pattern | memory | review. Memory words get a look-and-remember step first.
   {w} in the sentence is replaced by a blank while spelling. */
const SPELL_WORDS=[
 {w:'trip',type:'pattern',pic:'🧳✈️',say:'We go on a {w} to the beach.',tip:'Listen to the start: t and r make <b>tr</b>.'},
 {w:'dress',type:'pattern',pic:'👗',say:'She has a pink {w}.',tip:'Starts with <b>dr</b>. It ends with two s letters: <b>ss</b>.'},
 {w:'grab',type:'pattern',pic:'✊🍪',say:'{w} the cookie.',tip:'Listen to the start: g and r make <b>gr</b>.'},
 {w:'brick',type:'pattern',pic:'🧱',say:'The wall is made of {w}s. A red {w}.',tip:'Starts with <b>br</b>. The end sound is spelled <b>ck</b>.'},
 {w:'drop',type:'pattern',pic:'💧',say:'A {w} of rain.',tip:'Listen to the start: d and r make <b>dr</b>.'},
 {w:'crack',type:'pattern',pic:'🥚💥',say:'The egg has a {w}.',tip:'Starts with <b>cr</b>. The end sound is spelled <b>ck</b>.'},
 {w:'frog',type:'pattern',pic:'🐸',say:'The green {w} can hop.',tip:'Listen to the start: f and r make <b>fr</b>.'},
 {w:'you',type:'memory',pic:'👉😊',say:'I love {w}!',tricky:[1,2],tip:'<b>y</b>, then <b>o</b> and <b>u</b>. O and U are buddies that stick together in <b>you</b>.',sayTip:'Y, then O and U. O and U are buddies that stick together.'},
 {w:'they',type:'memory',pic:'👧👦⚽',say:'{w} play ball.',tricky:[2,3],tip:'Start with <b>the</b>, then add <b>y</b>. the + y = <b>they</b>!',sayTip:'Start with the word the, then add a Y. The, plus Y, makes they!'},
 {w:'says',type:'memory',pic:'🐮💬',say:'The cow {w} moo.',tricky:[1,2],tip:'It sounds like “sez”, but it is <b>say</b> with an <b>s</b> on the end. say + s = <b>says</b>!',sayTip:'It sounds like sez, but it is the word say, with an S on the end. Say, plus S, makes says!'},
 {w:'we',type:'review',pic:'👨‍👧❤️',say:'{w} give a big hug.',tip:'Just two letters: <b>w</b> and <b>e</b>.'},
 {w:'miss',type:'review',pic:'🏀💨',say:'Oops! I {w} the hoop.',tip:'Starts with <b>m</b>. It ends with two s letters: <b>ss</b>.'}
];
const SP_TYPES={pattern:['🧩','Pattern word'],memory:['🧠','Memory word'],review:['🔁','Review word']};
const SP_COLORS=['#78ad72','#a58cc5','#e7a072','#7cacc5','#d98da5','#e0bb45','#5fb3a8'];
const SP_PARTS={
 eyes:{name:'Extra eye',icon:'👁️',max:3},horns:{name:'Horns',icon:'😈',max:2},arms:{name:'Arms',icon:'💪',max:2},
 legs:{name:'Legs',icon:'🦵',max:2},spikes:{name:'Spikes',icon:'🔺',max:5},spots:{name:'Spots',icon:'🔵',max:6},
 wings:{name:'Wings',icon:'🦋',max:1},tail:{name:'Tail',icon:'🐉',max:1},antennae:{name:'Antenna',icon:'🐜',max:2},
 teeth:{name:'Fangs',icon:'🦷',max:1},tongue:{name:'Silly tongue',icon:'👅',max:1},crown:{name:'Crown',icon:'👑',max:1},
 bow:{name:'Bow',icon:'🎀',max:1},cape:{name:'Super cape',icon:'🦸',max:1},boots:{name:'Rocket boots',icon:'🚀',max:1},
 belly:{name:'Star belly',icon:'⭐',max:1},sparkle:{name:'Sparkles',icon:'✨',max:1},hair:{name:'Fluffy hair',icon:'🦁',max:1},
 tall:{name:'Grow taller',icon:'📏',max:2},paint:{name:'New color',icon:'🎨',max:Infinity}
};
/* More rewards. cat: accessory (from round 1) · family, room, toy (unlock after round 1).
   slot: only one item per slot is worn at a time (a new hat replaces the old one). */
const SP_CATS={monster:{name:'Monster part',round:1},accessory:{name:'Accessory',round:1},family:{name:'Monster family',round:2,place:'home'},room:{name:'Room',round:2,place:'home'},toy:{name:'Toy',round:2,place:'home'},
 yard:{name:'Backyard',round:3,place:'yard'},party:{name:'Party',round:4,place:'party'},space:{name:'Space',round:5,place:'space'},castle:{name:'Castle',round:6,place:'castle'},sea:{name:'Under the sea',round:7,place:'sea'},town:{name:'Town',round:2},people:{name:'Town people',round:2},car:{name:'Car',round:2}};
/* Each round unlocks a chapter. Rounds alternate between spelling and math (state.spell.kind). */
const MATH_MEDALS=['⭐','🥉','🥈','🥇','🏅','🎖️','🏆','👑','💎','🚀'];
const SP_CHAPTERS=[{icon:'👾',name:'Build your monster'},{icon:'🏠',name:'Home: family, room & toys'},{icon:'🌳',name:'Backyard'},{icon:'🎉',name:'Party'},{icon:'🚀',name:'Space'},{icon:'🏰',name:'Castle'},{icon:'🌊',name:'Under the sea'}];
const SP_PLACES={home:{icon:'🏠',name:'Home'},yard:{icon:'🌳',name:'Backyard'},party:{icon:'🎉',name:'Party'},space:{icon:'🚀',name:'Space'},castle:{icon:'🏰',name:'Castle'},sea:{icon:'🌊',name:'Under the sea'}};
function spChapter(round){return SP_CHAPTERS[round-1]||{icon:'⭐',name:'Superstar builder'};}
[['a_glasses','Glasses','👓','face'],['a_shades','Sunglasses','🕶️','face'],['a_hearts','Heart glasses','😍','face'],['a_stars','Star glasses','🤩','face'],
 ['a_tophat','Top hat','🎩','head'],['a_cap','Baseball cap','🧢','head'],['a_sunhat','Sun hat','👒','head'],['a_party','Party hat','🥳','head'],['a_grad','Smart cap','🎓','head'],
 ['a_scarf','Cozy scarf','🧣','neck'],["a_bowtie","Bow tie","👔","neck"],['a_necklace','Gem necklace','💎','neck'],
 ['a_balloon','Balloon','🎈','hand'],['a_wand','Magic wand','🪄','hand'],['a_lollipop','Lollipop','🍭','hand'],['a_umbrella','Umbrella','☂️','hand'],['a_sunflower','Sunflower','🌻','hand'],['a_icecream','Ice cream','🍦','hand'],
 ['a_flower','Flower','🌸','ear'],['a_headphones','Headphones','🎧','ear'],
 ['a_backpack','Backpack','🎒'],['a_mustache','Mustache','🥸'],['a_blush','Rosy cheeks','☺️'],['a_freckles','Freckles','🟤']
].forEach(([k,name,icon,slot])=>SP_PARTS[k]={name,icon,max:1,cat:'accessory',slot});
[['f_mom','Mom monster','👩'],['f_dad','Dad monster','👨'],['f_grandma','Grandma monster','👵'],['f_grandpa','Grandpa monster','👴'],['f_sister','Sister monster','👧'],
 ['f_brother','Brother monster','👦'],['f_baby','Baby monster','👶'],['f_dog','Pet puppy','🐶'],['f_cat','Pet kitty','🐱'],['f_hedgehog','Pet hedgehog','🦔']
].forEach(([k,name,icon])=>SP_PARTS[k]={name,icon,max:1,cat:'family'});
[['r_paint','Paint the walls','🖌️',Infinity],['r_window','Window','🪟'],['r_bunting','Party flags','🎏'],['r_picture','Picture','🖼️'],['r_clock','Clock','🕰️'],['r_books','Bookshelf','📚'],
 ['r_bed','Bed','🛏️'],['r_couch','Couch','🛋️'],['r_plant','Plant','🪴'],['r_lantern','Lantern','🏮'],['r_rug','Rug','🟣'],['r_mirror','Mirror','🪞'],['r_rainbow','Rainbow poster','🌈'],['r_moon','Moon light','🌙']
].forEach(([k,name,icon,max])=>SP_PARTS[k]={name,icon,max:max||1,cat:'room'});
[['t_teddy','Teddy bear','🧸'],['t_ball','Ball','⚽'],['t_kite','Kite','🪁'],['t_robot','Robot','🤖'],['t_car','Toy car','🚗'],['t_rocket','Rocket','🚀'],['t_duck','Rubber duck','🦆'],
 ['t_drum','Drum','🥁'],['t_train','Train','🚂'],['t_puzzle','Puzzle','🧩'],['t_yoyo','Yo-yo','🪀'],['t_doll','Doll','🪆'],['t_unicorn','Toy unicorn','🦄'],['t_guitar','Guitar','🎸'],['t_dino','Dinosaur','🦖'],['t_blocks','Blocks','🔠']
].forEach(([k,name,icon])=>SP_PARTS[k]={name,icon,max:1,cat:'toy'});
/* Place rewards: d = what to draw, as [emoji,x,y,size] (scene is 640×420; the monster stands at x≈80–320). */
const spPlaceItems={
 yard:[['y_sun','Sunshine','☀️',[['☀️',590,50,64]]],['y_clouds','Clouds','☁️',[['☁️',140,45,70],['☁️',400,35,52]]],['y_tree','Big tree','🌳',[['🌳',45,225,150]]],['y_treehouse','Treehouse','🛖',[['🛖',600,215,110]]],
  ['y_slide','Slide','🛝',[['🛝',400,255,110]]],['y_swing','Swing','🎠',[['🎠',520,250,90]]],['y_pool','Pool','🛟',[['🛟',470,392,48]]],['y_sandbox','Sandbox','🪣',[['🏖️',360,392,52],['🪣',405,398,34]]],
  ['y_flowers','Flowers','🌷',[['🌷',20,395,40],['🌼',60,398,38],['🌻',100,392,42]]],['y_butterfly','Butterfly','🦋',[['🦋',335,140,38]]],['y_bird','Bird','🐦',[['🐦',250,40,36]]],['y_garden','Veggie garden','🥕',[['🥕',590,398,38],['🍅',625,396,34]]],
  ['y_bee','Bee','🐝',[['🐝',360,105,30]]],['y_doghouse','Dog house','🏠',[['🏠',560,340,62]]]],
 party:[['p_cake','Birthday cake','🎂',[['🎂',470,268,70]]],['p_cupcakes','Cupcakes','🧁',[['🧁',405,284,40],['🧁',535,286,36]]],['p_pizza','Pizza','🍕',[['🍕',590,284,42]]],['p_presents','Presents','🎁',[['🎁',365,382,52],['🎁',415,396,40]]],
  ['p_balloons','Balloons','🎈',[['🎈',600,150,60],['🎈',565,120,50]]],['p_pinata','Piñata','🪅',[['🪅',330,95,64]]],['p_disco','Disco ball','🪩',[['🪩',470,52,56]]],['p_confetti','Confetti','🎊',[['🎊',185,45,52],['🎉',610,40,40]]],
  ['p_music','Music','🎶',[['🎶',60,120,52]]],['p_guests','Monster friends','👻',[['👻',520,375,52],['👾',590,382,48]]],['p_juice','Juice box','🧃',[['🧃',375,286,34]]],['p_candy','Candy','🍬',[['🍬',40,392,40],['🍭',80,388,38]]]],
 space:[['s_rocket','Rocket ship','🚀',[['🚀',560,190,120]]],['s_planet','Ringed planet','🪐',[['🪐',110,70,80]]],['s_earth','Earth','🌍',[['🌍',420,60,54]]],['s_ufo','UFO','🛸',[['🛸',335,120,64]]],
  ['s_alien','Alien friend','👽',[['👽',440,340,56]]],['s_astronaut','Astronaut','🧑‍🚀',[['🧑‍🚀',615,340,54]]],['s_comet','Comet','☄️',[['☄️',240,40,50]]],['s_satellite','Satellite','🛰️',[['🛰️',615,70,50]]],
  ['s_rover','Moon car','🚙',[['🚙',380,392,46]]],['s_telescope','Telescope','🔭',[['🔭',40,350,60]]],['s_flag','Flag','🚩',[['🚩',330,300,42]]],['s_shooting','Shooting star','🌠',[['🌠',180,105,52]]]],
 castle:[['c_castle','Castle','🏰',[['🏰',530,200,190]]],['c_dragon','Friendly dragon','🐉',[['🐉',110,120,110]]],['c_unicorn','Unicorn','🦄',[['🦄',400,345,70]]],['c_fairy','Fairy','🧚',[['🧚',340,120,52]]],
  ['c_wizard','Wizard','🧙',[['🧙',618,345,56]]],['c_rainbow','Rainbow','🌈',[['🌈',300,50,90]]],['c_crystal','Crystal ball','🔮',[['🔮',40,360,48]]],['c_treasure','Treasure','💰',[['💰',470,396,44]]],
  ['c_frog','Frog prince','🐸',[['🐸',360,396,40],['👑',360,370,22]]],['c_mushroom','Magic mushrooms','🍄',[['🍄',590,400,40],['🍄',620,404,30]]],['c_shield','Knight shield','🛡️',[['🛡️',440,290,44]]],['c_swan','Swan','🦢',[['🦢',120,392,46]]]],
 sea:[['o_whale','Whale','🐋',[['🐋',140,60,90]]],['o_fish','Fish','🐠',[['🐠',480,120,50],['🐟',540,160,40]]],['o_octopus','Octopus','🐙',[['🐙',570,300,90]]],['o_turtle','Sea turtle','🐢',[['🐢',400,352,54]]],
  ['o_crab','Crab','🦀',[['🦀',620,396,40]]],['o_shell','Seashell','🐚',[['🐚',30,396,40]]],['o_coral','Coral','🪸',[['🪸',42,300,90]]],['o_mermaid','Mermaid','🧜‍♀️',[['🧜‍♀️',350,190,70]]],
  ['o_dolphin','Dolphin','🐬',[['🐬',300,50,60]]],['o_jelly','Jellyfish','🪼',[['🪼',430,60,48]]],['o_seaweed','Seaweed','🌿',[['🌿',330,330,52]]],['o_starfish','Starfish','⭐',[['⭐',480,398,36]]],['o_puffer','Pufferfish','🐡',[['🐡',610,110,44]]]]
};
Object.entries(spPlaceItems).forEach(([cat,list])=>list.forEach(([k,name,icon,d])=>SP_PARTS[k]={name,icon,max:1,cat,d}));
[['b_school','School','🏫'],['b_shop','Shop','🏪'],['b_icecream','Ice cream shop','🍦'],['b_park','Fountain park','⛲'],['b_fire','Fire station','🚒'],['b_hospital','Hospital','🏥'],['b_library','Library','🏛️'],
 ['b_bakery','Bakery','🥐'],['b_playground','Playground','🛝'],['b_ferris','Ferris wheel','🎡'],['b_carousel','Carousel','🎠'],['b_bus','School bus','🚌'],['b_train','Train station','🚉'],['b_farm','Farm','🚜'],['b_hotel','Hotel','🏨'],['b_stadium','Stadium','🏟️'],['b_pond','Duck pond','🦆'],['b_tower','Tall tower','🗼'],['b_apartments','Apartments','🏢'],['b_office','Office tower','🏬'],['b_bank','Bank','🏦'],['b_post','Post office','📮'],['b_cinema','Movie theater','🎬'],['b_pizza','Pizza place','🍕'],['b_toys','Toy store','🧸'],['b_pets','Pet shop','🐾'],['b_police','Police station','🚓'],['b_museum','Dino museum','🦖'],['b_gas','Gas station','⛽'],['b_flowers','Flower shop','🌷'],['b_pool','Swimming pool','🏊'],['b_zoo','Zoo','🦒'],['b_castle','Town castle','🏰']
].forEach(([k,name,icon])=>SP_PARTS[k]={name,icon,max:1,cat:'town'});
[['h_police','Police officer','👮'],['h_fire','Firefighter','🧑‍🚒'],['h_doctor','Doctor','👩‍⚕️'],['h_chef','Chef','🧑‍🍳'],['h_teacher','Teacher','👩‍🏫'],['h_farmer','Farmer','🧑‍🌾'],['h_builder','Builder','👷'],['h_artist','Artist','🧑‍🎨'],['h_singer','Singer','🧑‍🎤'],['h_scientist','Scientist','🧑‍🔬'],
 ['h_pilot','Pilot','🧑‍✈️'],['h_hero','Superhero','🦸'],['h_princess','Princess','👸'],['h_prince','Prince','🤴'],['h_juggler','Juggler','🤹'],['h_kids','Kids playing','🧒'],['h_dogwalker','Dog walker','🦮'],['h_skater','Roller skater','🛼'],['h_runner','Runner','🏃‍♀️'],['h_mail','Mail carrier','📬']
].forEach(([k,name,icon])=>SP_PARTS[k]={name,icon,max:1,cat:'people'});
[['v_race','Race car','🏎️'],['v_police','Police car','🚓'],['v_fire','Fire truck','🚒'],['v_ambulance','Ambulance','🚑'],['v_taxi','Taxi','🚕'],['v_jeep','Jeep','🚙'],['v_red','Red car','🚗'],['v_pickup','Pickup truck','🛻'],
 ['v_van','Camper van','🚐'],['v_tractor','Tractor','🚜'],['v_truck','Big truck','🚚'],['v_moto','Motorcycle','🏍️'],['v_scooter','Scooter','🛵'],['v_bike','Bike','🚲'],['v_bus','Bus','🚌'],['v_monstertruck','Monster truck','🛞']
].forEach(([k,name,icon])=>SP_PARTS[k]={name,icon,max:1,cat:'car'});
Object.values(SP_PARTS).forEach(p=>p.cat=p.cat||'monster');
/* Math rounds (1st grade): add & take away within 10, word problems, counting 11–20 with ten frames. */
const MATH_OBJ={apple:['🍎','apple','apples'],frog:['🐸','frog','frogs'],star:['⭐','star','stars'],cookie:['🍪','cookie','cookies'],duck:['🦆','duck','ducks'],balloon:['🎈','balloon','balloons'],bug:['🐞','bug','bugs'],cupcake:['🧁','cupcake','cupcakes'],fish:['🐟','fish','fish'],shell:['🐚','shell','shells'],flower:['🌷','flower','flowers'],car:['🚗','car','cars'],bee:['🐝','bee','bees'],book:['📕','book','books'],pencil:['✏️','pencil','pencils'],bird:['🐦','bird','birds'],dog:['🐶','dog','dogs'],cat:['🐱','cat','cats'],kid:['🧒','kid','kids'],crayon:['🖍️','crayon','crayons']};
const MATH_BANK=[
 ...[[2,1,'apple'],[3,2,'frog'],[4,1,'star'],[2,3,'duck'],[5,2,'balloon'],[3,3,'bug'],[4,4,'cupcake'],[6,2,'fish'],[5,4,'apple'],[7,3,'star']].map(([a,b,o])=>({kind:'add',op:'+',a,b,o})),
 ...[[3,1,'cookie'],[4,2,'frog'],[5,1,'balloon'],[5,3,'apple'],[6,2,'duck'],[7,4,'star'],[8,3,'bug'],[9,5,'cupcake']].map(([a,b,o])=>({kind:'sub',op:'-',a,b,o})),
 {kind:'word',op:'+',a:4,b:2,o:'frog',text:'There are 4 frogs on a log. 2 more frogs hop on. How many frogs are there now?'},
 {kind:'word',op:'-',a:6,b:3,o:'cookie',text:'Lilly has 6 cookies. She eats 3. How many cookies are left?'},
 {kind:'word',op:'-',a:5,b:2,o:'duck',text:'5 ducks swim in the pond. 2 ducks swim away. How many ducks are left?'},
 {kind:'word',op:'+',a:3,b:4,o:'balloon',text:'There are 3 red balloons and 4 blue balloons. How many balloons in all?'},
 {kind:'word',op:'+',a:4,b:3,o:'bug',text:'4 bugs sit on a leaf. 3 more bugs land. How many bugs are there now?'},
 {kind:'word',op:'-',a:7,b:2,o:'cupcake',text:'The monster has 7 cupcakes. It gives 2 to a friend. How many cupcakes are left?'},
 {kind:'word',op:'+',a:5,b:3,o:'fish',text:'5 fish are in the tank. Dad adds 3 more. How many fish are there now?'},
 {kind:'word',op:'-',a:8,b:3,o:'star',text:'There are 8 stars in the sky. 3 stars hide behind a cloud. How many stars can you see?'},
 ...[[13,'star'],[16,'apple'],[11,'bug'],[18,'cupcake'],[15,'frog']].map(([a,o])=>({kind:'count',a,b:0,o}))
];
const MATH_ROUND_SIZE=10;
/* Story-problem rounds (1st grade): join, take away, compare ("how many more"), a few teen totals. */
const STORY_BANK=[
 ['+',3,2,'balloon','Lilly has 3 red balloons. Mom gives her 2 more. How many balloons does Lilly have now?'],
 ['+',4,3,'duck','There are 4 ducks in the pond. 3 more ducks swim over. How many ducks are in the pond now?'],
 ['+',5,4,'cookie','The monster eats 5 cookies. Then it eats 4 more cookies. How many cookies did it eat in all?'],
 ['+',6,2,'frog','6 frogs sit on a log. 2 more frogs hop on. How many frogs are on the log now?'],
 ['+',2,5,'shell','Oakley finds 2 shells. Lilly finds 5 shells. How many shells did they find in all?'],
 ['+',7,3,'car','There are 7 cars in the parking lot. 3 more cars drive in. How many cars are there now?'],
 ['+',4,4,'bee','4 bees are on a flower. 4 more bees fly over. How many bees are there now?'],
 ['+',3,3,'book','Lilly reads 3 books on Monday. She reads 3 books on Tuesday. How many books did she read?'],
 ['+',10,5,'fish','There are 10 fish in the tank. Dad adds 5 more fish. How many fish are in the tank now?'],
 ['+',8,4,'pencil','The class has 8 pencils. The teacher brings 4 more. How many pencils are there now?'],
 ['+',2,5,'cat','There are 2 cats on the bed. 5 more cats jump up. How many cats are on the bed now?'],
 ['+',6,4,'kid','The bus has 6 kids on it. 4 more kids get on. How many kids are on the bus now?'],
 ['-',8,3,'star','There are 8 stars in the sky. 3 stars hide behind a cloud. How many stars can you still see?'],
 ['-',9,4,'cupcake','The monster has 9 cupcakes. It shares 4 with friends. How many cupcakes are left?'],
 ['-',6,2,'bird','6 birds sit in a tree. 2 birds fly away. How many birds are left in the tree?'],
 ['-',7,1,'apple','There are 7 apples on the table. Lilly eats 1. How many apples are left?'],
 ['-',10,6,'bug','10 bugs are on a leaf. 6 bugs crawl away. How many bugs are left on the leaf?'],
 ['-',5,3,'dog','5 dogs play at the park. 3 dogs go home. How many dogs are still at the park?'],
 ['-',9,5,'flower','Lilly picks 9 flowers. She gives 5 to Grandma. How many flowers does Lilly have now?'],
 ['-',10,3,'crayon','Lilly has 10 crayons. She loses 3. How many crayons does she have now?'],
 ['-',9,2,'balloon','There are 9 balloons at the party. 2 balloons pop! How many balloons are left?'],
 ['-',12,2,'cookie','There are 12 cookies on a plate. The monsters eat 2. How many cookies are left?'],
 ['more',6,4,'shell','Lilly has 6 shells. Oakley has 4 shells. How many more shells does Lilly have?'],
 ['more',7,3,'car','There are 7 red cars and 3 blue cars. How many more red cars are there?'],
 ['more',5,2,'apple','The monster has 5 apples. Mom has 2 apples. How many more apples does the monster have?'],
 ['more',8,5,'duck','Lilly sees 8 ducks. Dad sees 5 ducks. How many more ducks does Lilly see?'],
 ['more',9,6,'star','Lilly has 9 star stickers. Her friend has 6. How many more stickers does Lilly have?']
].map(([op,a,b,o,text])=>({kind:'word',op,a,b,o,text}));
const STORY_ROUND_SIZE=8;
function mathAnswer(q){switch(q.kind){case 'missing':return q.b-q.a;case 'make10':return 10-q.a;case 'doubles':return q.a*2;case 'sub20':return q.a-q.b;case 'compare':return q.small?Math.min(q.a,q.b):Math.max(q.a,q.b);case 'skip':return q.a;case 'next':return q.dir==='after'?q.a+1:q.a-1;case 'tens':return q.a*10+q.b;case 'time':return q.a+':00';case 'shape':case 'measure':case 'tally':return q.a;default:return q.kind==='count'?q.a:q.op==='+'?q.a+q.b:q.a-q.b;}}
const MATH_SAY={
 prompt:q=>q.kind==='word'?q.text:q.kind==='count'?`How many ${MATH_OBJ[q.o][2]}? | Count carefully!`:q.op==='+'?`What is ${q.a} plus ${q.b}?`:`What is ${q.a} take away ${q.b}?`,
 win:q=>q.kind==='count'?`Yes! There are ${q.a} ${MATH_OBJ[q.o][2]}! | Pick a reward!`:q.op==='more'?`Yes! ${q.a} is ${mathAnswer(q)} more than ${q.b}! | Pick a reward!`:`Yes! ${q.a} ${q.op==='+'?'plus':'take away'} ${q.b} is ${mathAnswer(q)}! | Pick a reward!`,
 hint:q=>q.kind==='count'?'A full ten frame is 10. | Then count the rest.':q.op==='more'?'Match them up, one and one. | Count the extra ones that have no partner.':q.op==='+'?'Count them all together. | Start at 1 and keep going.':'Count only the ones that are not crossed out.'
};
/* More first-grade variety: missing numbers, make 10, doubles, teen take-away, compare, skip counting,
   before/after, tens & ones, time to the hour, shapes, measuring and tally marks. All fixed so audio can be recorded. */
(function(){const P=x=>MATH_BANK.push(x);
 [[3,7,'star'],[5,9,'apple'],[2,6,'frog'],[4,10,'balloon'],[6,8,'duck'],[1,5,'cookie'],[7,10,'bug']].forEach(([a,b,o])=>P({kind:'missing',a,b,o}));
 [7,4,9,6,2,8,3,5].forEach(a=>P({kind:'make10',a,b:0,o:'star'}));
 [5,6,7,8,9,4].forEach(a=>P({kind:'doubles',a,b:a,o:'apple'}));
 [[12,2],[15,5],[14,4],[18,8],[13,3],[17,7],[16,2],[19,4]].forEach(([a,b])=>P({kind:'sub20',a,b,o:'cupcake'}));
 [[47,52],[18,81],[36,33],[90,19],[64,46],[25,52],[71,17],[58,85]].forEach(([a,b],i)=>P({kind:'compare',a,b,small:i%2===1}));
 [[10,20,30,40],[20,30,40,50],[50,60,70,80],[30,40,50,60],[5,10,15,20],[15,20,25,30],[2,4,6,8],[6,8,10,12]].forEach(seq=>P({kind:'skip',seq,a:seq[3],b:seq[1]-seq[0]}));
 [[29,'after'],[59,'after'],[99,'after'],[40,'after'],[17,'after'],[30,'before'],[50,'before'],[71,'before'],[100,'before']].forEach(([a,dir])=>P({kind:'next',a,dir}));
 [[3,4],[2,7],[5,0],[1,6],[4,5],[6,2],[7,3],[1,9]].forEach(([a,b])=>P({kind:'tens',a,b}));
 [3,7,9,12,1,5,10,6].forEach(a=>P({kind:'time',a}));
 [['triangle',3],['square',4],['rectangle',4],['pentagon',5],['hexagon',6]].forEach(([name,a])=>P({kind:'shape',name,a}));
 [['pencil','✏️',5],['crayon','🖍️',3],['snake','🐍',7],['worm','🪱',4],['train','🚂',6],['ribbon','🎀',8]].forEach(([name,e,a])=>P({kind:'measure',name,e,a}));
 [7,9,12,6,11,8,14].forEach(a=>P({kind:'tally',a}));
})();
const MATH_NEW={
 missing:{p:q=>`${q.a} plus what number makes ${q.b}?`,w:q=>`Yes! ${q.a} plus ${q.b-q.a} makes ${q.b}! | Pick a reward!`,h:()=>'Start at the first number. | Count up until you reach the total.',l:['🧩','Missing number'],eq:q=>`${q.a} + ? = ${q.b}`,done:q=>`${q.a} + ${q.b-q.a} = ${q.b}`},
 make10:{p:q=>`There are ${q.a} stars. | How many more make 10?`,w:q=>`Yes! ${q.a} and ${10-q.a} make 10! | Pick a reward!`,h:()=>'Count the empty boxes in the ten frame.',l:['🔟','Make 10'],eq:q=>`${q.a} + ? = 10`,done:q=>`${q.a} + ${10-q.a} = 10`},
 doubles:{p:q=>`What is ${q.a} plus ${q.a}?`,w:q=>`Yes! Double ${q.a} is ${q.a*2}! | Pick a reward!`,h:()=>'Count both ten frames. | A full frame is 10.',l:['👯','Doubles'],eq:q=>`${q.a} + ${q.a} = ?`,done:q=>`${q.a} + ${q.a} = ${q.a*2}`},
 sub20:{p:q=>`What is ${q.a} take away ${q.b}?`,w:q=>`Yes! ${q.a} take away ${q.b} is ${q.a-q.b}! | Pick a reward!`,h:()=>'Count only the ones that are not crossed out.',l:['🔢','Taking away'],eq:q=>`${q.a} − ${q.b} = ?`,done:q=>`${q.a} − ${q.b} = ${q.a-q.b}`},
 compare:{p:q=>`Which number is ${q.small?'smaller':'bigger'}, ${q.a} or ${q.b}?`,w:q=>`Yes! ${mathAnswer(q)} is ${q.small?'smaller':'bigger'}! | Pick a reward!`,h:()=>'Look at the tens first. | More tens means a bigger number.',l:['⚖️','Bigger or smaller'],eq:q=>`Which is ${q.small?'smaller':'bigger'}?`,done:q=>`${mathAnswer(q)} is ${q.small?'smaller':'bigger'}`},
 skip:{p:q=>`Count by ${q.b}s: ${q.seq.slice(0,3).join(', ')}. | What comes next?`,w:q=>`Yes! ${q.seq.join(', ')}! | Pick a reward!`,h:q=>`Add ${q.b} more each time.`,l:['🦘','Skip counting'],eq:q=>`${q.seq.slice(0,3).join(', ')}, ?`,done:q=>q.seq.join(', ')},
 next:{p:q=>`What number comes ${q.dir} ${q.a}?`,w:q=>`Yes! ${mathAnswer(q)} comes ${q.dir} ${q.a}! | Pick a reward!`,h:q=>q.dir==='after'?'After means one more.':'Before means one less.',l:['➡️','Before & after'],eq:q=>q.dir==='after'?`${q.a}, ?`:`?, ${q.a}`,done:q=>q.dir==='after'?`${q.a}, ${q.a+1}`:`${q.a-1}, ${q.a}`},
 tens:{p:()=>'How many blocks? | Count the tens, then the ones.',w:q=>`Yes! ${q.a} tens and ${q.b} ones make ${q.a*10+q.b}! | Pick a reward!`,h:()=>'Each tall stick is 10. | Count by tens, then count the little cubes.',l:['🧱','Tens & ones'],eq:()=>'How many blocks?',done:q=>`${q.a} tens + ${q.b} ones = ${q.a*10+q.b}`},
 time:{p:()=>'What time does the clock show?',w:q=>`Yes! It is ${q.a} o'clock! | Pick a reward!`,h:()=>'The short hand points to the hour. | The long hand is on the 12.',l:['🕒','Tell time'],eq:()=>'What time is it?',done:q=>`${q.a}:00`},
 shape:{p:q=>`How many sides does a ${q.name} have?`,w:q=>`Yes! A ${q.name} has ${q.a} sides! | Pick a reward!`,h:()=>'Touch each side and count.',l:['🔷','Shapes'],eq:q=>`How many sides?`,done:q=>`${q.a} sides`},
 measure:{p:q=>`How many cubes long is the ${q.name}?`,w:q=>`Yes! The ${q.name} is ${q.a} cubes long! | Pick a reward!`,h:()=>'Count the cubes under it, one by one.',l:['📏','Measure'],eq:()=>'How many cubes long?',done:q=>`${q.a} cubes long`},
 tally:{p:()=>'How many tally marks?',w:q=>`Yes! There are ${q.a} tally marks! | Pick a reward!`,h:()=>'Each bundle with a line across is 5. | Count 5, 10, then the rest.',l:['✋','Tally marks'],eq:()=>'How many tally marks?',done:q=>String(q.a)}
};
{const op=MATH_SAY.prompt,ow=MATH_SAY.win,oh=MATH_SAY.hint;
 MATH_SAY.prompt=q=>MATH_NEW[q.kind]?MATH_NEW[q.kind].p(q):op(q);
 MATH_SAY.win=q=>MATH_NEW[q.kind]?MATH_NEW[q.kind].w(q):ow(q);
 MATH_SAY.hint=q=>MATH_NEW[q.kind]?MATH_NEW[q.kind].h(q):oh(q);}
function mathLabel(q){return MATH_NEW[q.kind]?MATH_NEW[q.kind].l:q.kind==='word'?['📖','Story problem']:q.kind==='count'?['🔢','Counting']:q.op==='+'?['🔢','Adding']:['🔢','Taking away'];}
function mathEq(q){return MATH_NEW[q.kind]?MATH_NEW[q.kind].eq(q):q.kind==='count'?`How many ${MATH_OBJ[q.o][2]}?`:q.kind==='word'?'':`${q.a} ${q.op==='+'?'+':'−'} ${q.b} = ?`;}
function mathDoneText(q){return MATH_NEW[q.kind]?MATH_NEW[q.kind].done(q):q.kind==='count'?String(q.a):`${q.a} ${q.op==='+'?'+':'−'} ${q.b} = ${mathAnswer(q)}`;}
function mathChoices(q){
 const ans=mathAnswer(q);
 if(q.kind==='compare')return shuffle([q.a,q.b]).map(String);
 if(q.kind==='time'){const h=q.a,o=[h%12+1,(h+5)%12+1].filter(x=>x!==h);return shuffle([`${h}:00`,...o.slice(0,2).map(x=>`${x}:00`)]);}
 const step=q.kind==='skip'?q.b:1,opts=[ans,ans+step,ans-step,ans+2*step].filter(x=>x>=0);
 return shuffle([...new Set(opts)].slice(0,3)).map(String);
}
/* Everything the spelling game says. make_audio.mjs records each line; " | " is a short pause. */
const spCap=x=>x[0].toUpperCase()+x.slice(1);
const SP_SAY={
 prompt:w=>`${spCap(w.w)}. | ${spCap(w.say.replaceAll('{w}',w.w))}`,
 word:w=>`${spCap(w.w)}.`,
 letter:l=>`${l.toUpperCase()}.`,
 spellOut:w=>`${[...w.w].map(l=>l.toUpperCase()).join(', ')}. | ${spCap(w.w)}.`,
 win:w=>`You spelled ${w.w}! | Pick a monster part!`,
 tip:w=>w.sayTip||w.tip.replace(/<[^>]+>/g,''),
 tryAgain:()=>'Oops! Try again.',
 roundDone:()=>'Hooray! You spelled all the words!',
 mathDone:()=>'Hooray! You solved all the math problems!',
 storyDone:()=>'Hooray! You solved all the story problems!'
};
function spAllLines(){const out=new Set([SP_SAY.tryAgain(),SP_SAY.roundDone(),SP_SAY.mathDone(),SP_SAY.storyDone(),...'abcdefghijklmnopqrstuvwxyz'].map(x=>x.length===1?SP_SAY.letter(x):x));SPELL_WORDS.forEach(w=>['prompt','word','spellOut','win','tip'].forEach(k=>out.add(SP_SAY[k](w))));[...MATH_BANK,...STORY_BANK].forEach(q=>['prompt','win','hint'].forEach(k=>out.add(MATH_SAY[k](q))));return [...out];}
let spRun=null;
/* Saving: every change is stored on the device and backed up to the Mac (saves/spelling.json via launch.py). */
var spServerReady=false,spBackupTimer=null;
function spPersist(){if(state.spell)state.spell.updatedAt=Date.now();spSyncSaved();persist();spBackup();}
function spBackup(){if(!spServerReady||!state.spell||!state.spell.updatedAt||!spHasProgress(state.spell))return;clearTimeout(spBackupTimer);spBackupTimer=setTimeout(()=>fetch('api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({updatedAt:state.spell.updatedAt,stars:state.stars,spell:state.spell})}).catch(()=>{}),700);}
function spSyncSaved(){const s=state.spell;if(s&&Number.isInteger(s.savedIdx)&&s.shelf[s.savedIdx])s.shelf[s.savedIdx].monster=s.monster;}
function spSaveCurrent(ask){const s=ensureSpell();if(Number.isInteger(s.savedIdx)&&s.shelf[s.savedIdx])return true;const def=`Monster ${s.shelf.length+1}`;let name=def;if(ask){name=prompt('Name your monster:',def);if(name===null)return false;}s.shelf.push({name:name.trim().slice(0,24)||def,monster:s.monster});s.savedIdx=s.shelf.length-1;return true;}
function newSpellMonster(){return{parts:{},paint:0,level:1};}
/* Each monster unlocks rewards through its own rounds (level 1 = monster parts & accessories). */
function spLevel(m){return (m&&m.level)||1;}
/* The world (rooms, what's in them, wall paint, cars) is shared by all monsters in state.spell.world.
   spM(m) = the monster plus the shared world, for drawing and reward checks. */
function spM(m){const W=(state.spell&&state.spell.world)||{parts:{},where:{},walls:{}};return {...m,parts:{...W.parts,...(m.parts||{})},where:{...W.where,...(m.where||{})},walls:{...W.walls,...(m.walls||{})}};}
function spIsMath(s){return !!s&&(s.kind==='math'||s.kind==='story');}
function spBank(kind){return kind==='story'?STORY_BANK:MATH_BANK;}
function spRoundSize(kind){return kind==='story'?STORY_ROUND_SIZE:kind==='math'?MATH_ROUND_SIZE:SPELL_WORDS.length;}
function spMixedOrder(bank,size){const by={};bank.forEach((q,i)=>(by[q.kind]=by[q.kind]||[]).push(i));const kinds=shuffle(Object.keys(by)),pools=kinds.map(k=>shuffle(by[k])),out=[];for(let r=0;out.length<size&&r<50;r++)pools.forEach(pl=>{if(out.length<size&&pl[r]!==undefined)out.push(pl[r]);});return shuffle(out);}
function spShuffleOrder(kind){if(kind==='math')return spMixedOrder(MATH_BANK,MATH_ROUND_SIZE);return kind==='spell'||!kind?shuffle(SPELL_WORDS.map((_,i)=>i)):shuffle(spBank(kind).map((_,i)=>i)).slice(0,spRoundSize(kind));}
function spOrderOk(s){const list=spIsMath(s)?spBank(s.kind):SPELL_WORDS,len=spRoundSize(s.kind);return Array.isArray(s.order)&&s.order.length===len&&s.order.every(i=>list[i]);}
function ensureSpell(){
 const s=state.spell;
 if(!s||!s.monster||!Number.isInteger(s.round)){
  state.spell={round:1,kind:'math',order:spShuffleOrder('math'),pos:0,phase:null,monster:newSpellMonster(),shelf:(s&&Array.isArray(s.shelf))?s.shelf:[],words:0};
 }
 if(state.spell.kind!=='math'&&state.spell.kind!=='story'){state.spell.kind='math';state.spell.order=spShuffleOrder('math');state.spell.pos=0;state.spell.phase=null;}
 if(!spOrderOk(state.spell)){const t=state.spell;t.order=spShuffleOrder(t.kind);t.pos=0;t.phase=null;t.choices=null;}
 if(!state.spell.phase)state.spell.phase=spStartPhase();
 if(state.spell.monster.level===undefined)state.spell.monster.level=state.spell.round;
 if(!state.spell.world){const W={parts:{},where:{},walls:{}};const strip=mm=>{if(!mm||!mm.parts)return;Object.keys(mm.parts).forEach(k=>{if(spIsWorld(k)){W.parts[k]=Math.max(W.parts[k]||0,mm.parts[k]);delete mm.parts[k];}});Object.assign(W.where,mm.where||{});Object.assign(W.walls,mm.walls||{});delete mm.where;delete mm.walls;};strip(state.spell.monster);state.spell.shelf.forEach(x=>strip(x.monster));state.spell.world=W;}
 state.spell.shelf.forEach(x=>{if(x.monster&&x.monster.level===undefined)x.monster.level=state.spell.round;});
 if(state.spell.buildTokens===undefined)state.spell.buildTokens=3;
 return state.spell;
}
function spWord(){const s=state.spell;return spIsMath(s)?null:SPELL_WORDS[s.order[Math.min(s.pos,s.order.length-1)]];}
function spProblem(){const s=state.spell;return spIsMath(s)?spBank(s.kind)[s.order[Math.min(s.pos,s.order.length-1)]]:null;}
function spStartPhase(){return spIsMath(state.spell)?'math':spWord().type==='memory'?'look':'spell';}
function spNextRound(s){s.round++;s.kind=s.kind==='math'?'story':'math';s.pos=0;s.order=spShuffleOrder(s.kind);s.choices=null;s.phase=spStartPhase();spRun=null;}
function spAvailable(m,round){const town=state.spell&&state.spell.town;return Object.keys(SP_PARTS).filter(k=>{const p=SP_PARTS[k];if(p.cat==='town'||p.cat==='people')return (round||1)>=2&&!!(town&&town.style)&&!(town.buildings||[]).includes(k);return (round||1)>=SP_CATS[p.cat].round&&(m.parts[k]||0)<p.max&&k!=='paint';});}
function spMakeChoices(){
 const s=state.spell,m=s.monster,pool=shuffle([...spAvailable(spM(m),s.round).filter(k=>['monster','accessory'].includes(SP_PARTS[k].cat)),'paint']),picks=[];
 const newest=Math.max(...pool.map(k=>SP_CATS[SP_PARTS[k].cat].round));
 const cats=[...new Set(pool.filter(k=>SP_CATS[SP_PARTS[k].cat].round===newest).map(k=>SP_PARTS[k].cat))].slice(0,1);
 shuffle([...new Set(pool.map(k=>SP_PARTS[k].cat))]).forEach(c=>{if(!cats.includes(c))cats.push(c);});
 for(const c of cats){if(picks.length>=3)break;const k=pool.find(x=>SP_PARTS[x].cat===c&&SP_PARTS[x].max!==Infinity&&!picks.includes(x));if(k)picks.push(k);}
 for(const k of pool){if(picks.length>=3)break;if(!picks.includes(k))picks.push(k);}
 const car=pool.find(k=>SP_PARTS[k].cat==='car');
 if(car&&!picks.some(k=>SP_PARTS[k].cat==='car')&&Math.random()<.5)picks[2]=car;
 return picks;
}
function spWithPart(m,k){
 if(k==='paint')return {...m,paint:(m.paint||0)+1};
 const parts={...m.parts},slot=SP_PARTS[k].slot;
 if(slot)Object.keys(parts).forEach(x=>{if(SP_PARTS[x]&&SP_PARTS[x].slot===slot)delete parts[x];});
 parts[k]=(parts[k]||0)+1;const room=m.room||'home';
 if(k==='r_paint'){const wr=room==='party'?'party':'home';return {...m,parts,walls:{home:spWall(m,'home'),...(m.walls||{}),[wr]:spWall(m,wr)+1}};}
 if(spIsWorld(k))return {...m,parts,where:{...(m.where||{}),[k]:room}};
 return {...m,parts};
}
function spPartCount(m){return Object.values(m.parts).reduce((a,b)=>a+b,0);}

function spMonsterInner(m){
 const n=k=>(m.parts&&m.parts[k])||0,c=SP_COLORS[(m.paint||0)%SP_COLORS.length];
 const H=150+n('tall')*30,yb=320,yt=yb-H,ink='#263e36',shade='#00000026';
 const line=(x1,y1,x2,y2,w,col)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
 const star=(x,y,r,fill)=>{let d='';for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,rr=i%2?r*.45:r;d+=(i?'L':'M')+(x+rr*Math.cos(a)).toFixed(1)+' '+(y+rr*Math.sin(a)).toFixed(1);}return `<path d="${d}Z" fill="${fill}"/>`;};
 let o=`<ellipse cx="200" cy="350" rx="125" ry="14" fill="#b4c39e" opacity=".55"/>`;
 if(n('wings'))o+=`<path d="M150 ${yt+50}L55 ${yt+5}L72 ${yt+100}Z" fill="#b192d8"/><path d="M250 ${yt+50}L345 ${yt+5}L328 ${yt+100}Z" fill="#b192d8"/><path d="M150 ${yt+58}L90 ${yt+35}L98 ${yt+85}Z" fill="#f0acbe"/><path d="M250 ${yt+58}L310 ${yt+35}L302 ${yt+85}Z" fill="#f0acbe"/>`;
 if(n('cape'))o+=`<path d="M152 ${yt+40}H248L292 ${yb+18}H108Z" fill="#cc6c84"/>`;
 if(n('tail'))o+=`<path d="M245 ${yb-25}C305 ${yb-15} 335 ${yb-60} 318 ${yb-105}" stroke="${c}" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M318 ${yb-105}l-14-18 26 2Z" fill="#f5cb63"/>`;
 if(n('legs')>=2)o+=line(150,yb-35,92,yb+14,15,c)+`<ellipse cx="86" cy="${yb+20}" rx="17" ry="9" fill="#4b7650"/>`+line(250,yb-35,308,yb+14,15,c)+`<ellipse cx="314" cy="${yb+20}" rx="17" ry="9" fill="#4b7650"/>`;
 if(n('legs')>=1)o+=line(148,yb-12,120,yb+20,15,c)+`<ellipse cx="114" cy="${yb+25}" rx="17" ry="9" fill="#4b7650"/>`+line(252,yb-12,280,yb+20,15,c)+`<ellipse cx="286" cy="${yb+25}" rx="17" ry="9" fill="#4b7650"/>`;
 if(n('boots'))o+=`<path d="M160 ${yb+25}l8 20 8-20Zm50 0l8 20 8-20Z" fill="#f0a950"/>`;
 const foot=n('boots')?'#9b87cc':'#4b7650';
 o+=`<rect x="155" y="${yb-5}" width="35" height="30" rx="4" fill="${foot}"/><rect x="210" y="${yb-5}" width="35" height="30" rx="4" fill="${foot}"/>`;
 for(let i=0;i<n('spikes');i++){const y=yt+16+i*(H-40)/4;o+=`<path d="M142 ${y-13}L112 ${y}L142 ${y+13}Z" fill="#4b7650"/><path d="M258 ${y-13}L288 ${y}L258 ${y+13}Z" fill="#4b7650"/>`;}
 if(n('arms')>=1)o+=line(145,yt+72,102,yt+38,16,c)+`<circle cx="98" cy="${yt+34}" r="12" fill="${c}"/><circle cx="98" cy="${yt+34}" r="12" fill="${shade}"/>`+line(255,yt+72,298,yt+38,16,c)+`<circle cx="302" cy="${yt+34}" r="12" fill="${c}"/><circle cx="302" cy="${yt+34}" r="12" fill="${shade}"/>`;
 if(n('arms')>=2)o+=line(145,yt+108,98,yt+128,16,c)+`<circle cx="94" cy="${yt+131}" r="12" fill="${c}"/><circle cx="94" cy="${yt+131}" r="12" fill="${shade}"/>`+line(255,yt+108,302,yt+128,16,c)+`<circle cx="306" cy="${yt+131}" r="12" fill="${c}"/><circle cx="306" cy="${yt+131}" r="12" fill="${shade}"/>`;
 o+=`<rect x="140" y="${yt}" width="120" height="${H}" rx="18" fill="${c}"/><rect x="152" y="${yt+10}" width="18" height="12" rx="4" fill="#ffffff40"/><rect x="236" y="${yt+10}" width="12" height="${H-26}" rx="6" fill="${shade}"/>`;
 [[155,yb-22],[244,yb-46],[157,yb-70],[243,yb-94],[172,yb-14],[228,yb-16]].slice(0,n('spots')).forEach(([x,y])=>o+=`<circle cx="${x}" cy="${y}" r="8" fill="#ffffff66"/>`);
 if(n('belly'))o+=star(200,yb-36,20,'#f7d15e');
 const eye=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fffbed"/><circle cx="${x+2}" cy="${y+2}" r="${r*.48}" fill="${ink}"/>`;
 o+=eye(178,yt+42,15)+eye(222,yt+42,15);
 [[200,yt+16],[158,yt+17],[242,yt+17]].slice(0,n('eyes')).forEach(([x,y])=>o+=eye(x,y,10));
 o+=`<path d="M180 ${yt+72}Q200 ${yt+90} 220 ${yt+72}" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
 if(n('tongue'))o+=`<ellipse cx="208" cy="${yt+88}" rx="8" ry="11" fill="#e8798f"/>`;
 if(n('teeth'))o+=`<path d="M186 ${yt+77}l8 3-3 11Zm28 0l-8 3 3 11Z" fill="#fffbed"/>`;
 if(n('hair'))[166,184,200,216,234].forEach((x,i)=>o+=`<circle cx="${x}" cy="${yt-(i%2?8:3)}" r="13" fill="#8b5e3c"/>`);
 if(n('antennae')>=1)o+=line(182,yt,165,yt-48,5,ink)+`<circle cx="165" cy="${yt-52}" r="9" fill="#f5cb63"/>`;
 if(n('antennae')>=2)o+=line(218,yt,235,yt-48,5,ink)+`<circle cx="235" cy="${yt-52}" r="9" fill="#f5cb63"/>`;
 if(n('horns')>=1)o+=`<path d="M143 ${yt+14}Q118 ${yt-4} 116 ${yt-40}Q140 ${yt-22} 164 ${yt+2}Z" fill="#f4d387"/><path d="M257 ${yt+14}Q282 ${yt-4} 284 ${yt-40}Q260 ${yt-22} 236 ${yt+2}Z" fill="#f4d387"/>`;
 if(n('horns')>=2)o+=`<path d="M188 ${yt+2}L200 ${yt-40}L212 ${yt+2}Z" fill="#f4d387"/>`;
 if(n('crown'))o+=`<path d="M170 ${yt-4}v-28l15 12 15-20 15 20 15-12v28Z" fill="#edbc4b"/>`;
 if(n('bow'))o+=`<path d="M246 ${yt+6}l-22-14v28Zm0 0l22-14v28Z" fill="#ef7fae"/><circle cx="246" cy="${yt+6}" r="6" fill="#d95f94"/>`;
 if(n('sparkle'))o+=star(92,yt+10,12,'#ef91bc')+star(312,yt+62,10,'#ef91bc')+star(80,yb-45,9,'#ef91bc')+star(322,yb-8,12,'#ef91bc');
 o+=spAccessories(n,yt,yb);
 return o;
}
const spEmoji=(x,y,size,e)=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
function spAccessories(n,yt,yb){
 let o='';const ink='#263e36',hand=n('arms')?[312,yt+8]:[292,yt+70];
 if(n('a_backpack'))o+=spEmoji(122,yt+100,58,'🎒');
 if(n('a_blush'))o+=`<ellipse cx="160" cy="${yt+66}" rx="11" ry="7" fill="#f28fa5" opacity=".75"/><ellipse cx="240" cy="${yt+66}" rx="11" ry="7" fill="#f28fa5" opacity=".75"/>`;
 if(n('a_freckles'))[[158,62],[166,70],[152,70],[242,62],[234,70],[248,70]].forEach(([x,y])=>o+=`<circle cx="${x}" cy="${yt+y}" r="2.6" fill="#8b5e3c"/>`);
 if(n('a_mustache'))o+=`<path d="M200 ${yt+64}c-8-10-26-10-34 2 10-2 20 4 34 2 14 2 24-4 34-2-8-12-26-12-34-2Z" fill="#5a3b26"/>`;
 if(n('a_glasses'))o+=`<g fill="none" stroke="${ink}" stroke-width="4"><circle cx="178" cy="${yt+42}" r="20"/><circle cx="222" cy="${yt+42}" r="20"/><path d="M198 ${yt+42}h4M158 ${yt+40}h-18M242 ${yt+40}h18"/></g>`;
 if(n('a_shades'))o+=`<g fill="#1f2a30"><rect x="154" y="${yt+28}" width="44" height="28" rx="10"/><rect x="202" y="${yt+28}" width="44" height="28" rx="10"/><rect x="190" y="${yt+34}" width="20" height="5"/></g><rect x="160" y="${yt+32}" width="12" height="6" rx="3" fill="#ffffff55"/>`;
 if(n('a_hearts'))o+=spEmoji(178,yt+43,40,'❤️')+spEmoji(222,yt+43,40,'❤️');
 if(n('a_stars'))o+=spEmoji(178,yt+43,42,'⭐')+spEmoji(222,yt+43,42,'⭐');
 if(n('a_scarf'))o+=`<rect x="138" y="${yt+96}" width="124" height="18" rx="8" fill="#e05d5d"/><rect x="220" y="${yt+104}" width="18" height="46" rx="6" fill="#e05d5d"/><path d="M150 ${yt+96}v18M170 ${yt+96}v18M190 ${yt+96}v18M210 ${yt+96}v18M250 ${yt+96}v18" stroke="#f3a0a0" stroke-width="4"/>`;
 if(n('a_bowtie'))o+=`<path d="M200 ${yt+104}l-26-14v28Zm0 0l26-14v28Z" fill="#3f7fd0"/><circle cx="200" cy="${yt+104}" r="6" fill="#2d5fa0"/>`;
 if(n('a_necklace'))o+=`<path d="M158 ${yt+92}Q200 ${yt+124} 242 ${yt+92}" stroke="#f5cb63" stroke-width="4" fill="none" stroke-dasharray="2 7" stroke-linecap="round"/>`+spEmoji(200,yt+114,24,'💎');
 if(n('a_tophat'))o+=spEmoji(200,yt-30,76,'🎩');
 if(n('a_cap'))o+=spEmoji(200,yt-16,70,'🧢');
 if(n('a_sunhat'))o+=spEmoji(200,yt-20,84,'👒');
 if(n('a_grad'))o+=spEmoji(200,yt-24,74,'🎓');
 if(n('a_party'))o+=`<path d="M176 ${yt+2}L200 ${yt-62}L224 ${yt+2}Z" fill="#8fd3f4"/><path d="M185 ${yt-24}l30 10M180 ${yt-8}l40 8" stroke="#ef7fae" stroke-width="6"/><circle cx="200" cy="${yt-64}" r="8" fill="#f5cb63"/>`;
 if(n('a_headphones'))o+=`<path d="M140 ${yt+40}Q140 ${yt-40} 200 ${yt-40}Q260 ${yt-40} 260 ${yt+40}" stroke="#3b3f58" stroke-width="10" fill="none"/><rect x="128" y="${yt+26}" width="22" height="38" rx="9" fill="#e45b8f"/><rect x="250" y="${yt+26}" width="22" height="38" rx="9" fill="#e45b8f"/>`;
 if(n('a_flower'))o+=spEmoji(252,yt+8,40,'🌸');
 const held=['a_balloon','a_wand','a_lollipop','a_umbrella','a_sunflower','a_icecream'].find(k=>n(k));
 if(held==='a_balloon')o+=`<path d="M${hand[0]-10} ${hand[1]+26}Q${hand[0]+14} ${hand[1]-20} ${hand[0]+10} ${hand[1]-60}" stroke="${ink}" stroke-width="2" fill="none"/>`+spEmoji(hand[0]+10,hand[1]-84,56,'🎈');
 else if(held)o+=spEmoji(hand[0],hand[1]-12,54,SP_PARTS[held].icon);
 return o;
}
const SP_FAMILY={
 f_mom:{at:[355,360,.34],look:{parts:{bow:1,a_necklace:1,a_blush:1},paint:4}},
 f_dad:{at:[420,360,.38],look:{parts:{horns:1,a_mustache:1,a_bowtie:1},paint:3}},
 f_grandma:{at:[485,360,.33],look:{parts:{hair:1,a_glasses:1,a_scarf:1},paint:1}},
 f_grandpa:{at:[550,360,.36],look:{parts:{a_mustache:1,a_cap:1,teeth:1},paint:2}},
 f_sister:{at:[612,360,.3],look:{parts:{a_flower:1,spots:3,a_blush:1},paint:5}},
 f_brother:{at:[390,386,.24],look:{parts:{antennae:2,spikes:3,a_freckles:1},paint:6}},
 f_baby:{at:[455,388,.18],look:{parts:{a_blush:1},paint:4}},
 f_dog:{at:[520,384,0],emoji:'🐕'},f_cat:{at:[585,384,0],emoji:'🐈'},f_hedgehog:{at:[345,392,0],emoji:'🦔'}
};
const SP_WALLS=['#f3ead8','#dbe9f6','#f8dbe6','#e2f0d9','#ece2f7','#fff0bf','#d8f1ee'];
/* Rooms: Home is the big room with the monster. The other scenes sit below it.
   She taps a scene (or its button) to choose where new things go; m.where remembers each item's scene. */
const SP_WORLD_CATS=['family','room','toy','yard','party','space','castle','sea','car'];
function spIsWorld(k){return !!SP_PARTS[k]&&SP_WORLD_CATS.includes(SP_PARTS[k].cat);}
function spWhere(m,k){return (m.where&&m.where[k])||SP_CATS[SP_PARTS[k].cat].place||'home';}
function spWall(m,room){return m.walls&&m.walls[room]!==undefined?m.walls[room]:room==='home'?((m.parts&&m.parts.r_paint)||0):0;}
function spRoomsFor(m,round){return [];return Object.keys(SP_PLACES).filter(pl=>pl==='home'?round>=2||spHasWorld(m):round>=SP_CATS[pl].round||Object.keys(m.parts||{}).some(k=>spIsWorld(k)&&spWhere(m,k)===pl));}
function spPlacesOf(m){return Object.keys(SP_PLACES).filter(pl=>Object.keys(m.parts||{}).some(k=>spIsWorld(k)&&spWhere(m,k)===pl));}
function spHasWorld(m){return Object.keys(m.parts||{}).some(spIsWorld);}
const SP_SLOTS={home:[340,388,436,484,532,580,628].map(x=>[x,196,40]).concat([180,226,272].map(x=>[x,236,38])),
 other:[40,96,152,208,264,320,376,432,488,544,600].map(x=>[x,392,44]).concat([360,412,464,516,568,620].map(x=>[x,320,44]),[360,412,464,516,568,620].map(x=>[x,190,44]),[60,120,180,240,300].map(x=>[x,110,44]))};
function spSceneItems(m,room){
 let o='',slot=0;const n=k=>(m.parts&&m.parts[k])||0,slots=room==='home'?SP_SLOTS.home:SP_SLOTS.other;
 Object.keys(m.parts||{}).forEach(k=>{
  if(!spIsWorld(k)||!n(k)||spWhere(m,k)!==room||k==='r_paint')return;
  const p=SP_PARTS[k],native=SP_CATS[p.cat].place===room;
  if(native&&room==='home')return; // home items have hand-placed spots below
  if(native&&p.d){p.d.forEach(([e,x,y,size])=>o+=spEmoji(x,y,size,e));return;}
  const [x,y,size]=slots[slot++%slots.length];o+=spEmoji(x,y,p.cat==='car'?size*1.5:size,p.icon);
 });
 return o;
}
function spellMonster(m,view){
 m=spM(m);const inner=spMonsterInner(m),rooms=spRoomsFor(m,state.spell.round);
 if(!rooms.length)return `<svg viewBox="0 30 400 350" role="img" aria-label="Your spelling monster">${inner}</svg>`;
 const sel=rooms.includes(m.room)?m.room:'home';
 return spWorldSvg(m,inner,rooms,sel);
}
function spRoomContent(m,room,inner){
 if(room!=='home'){let bd=SP_BACKDROPS[room];if(room==='party'&&m.walls&&m.walls.party!==undefined)bd=bd.replace('fill="#ffe3f0"',`fill="${SP_WALLS[m.walls.party%SP_WALLS.length]}"`);
  return bd+spSceneItems(m,room)+(inner?`<g transform="translate(40 85) scale(.8)">${inner}</g>`:'');}
 const n=k=>(m.parts&&m.parts[k])||0,nh=k=>spIsWorld(k)&&spWhere(m,k)!=='home'?0:n(k),E=spEmoji;
 let o=`<rect width="640" height="300" fill="${SP_WALLS[spWall(m,'home')%SP_WALLS.length]}"/><rect y="300" width="640" height="120" fill="#dcb68c"/><path d="M0 300H640" stroke="#b98f63" stroke-width="6"/><path d="M0 340H640M0 380H640M90 300v40M260 340v40M430 300v40M560 340v40M150 380v40M380 380v40" stroke="#c9a176" stroke-width="2"/>`;
 if(nh('r_window'))o+=`<rect x="30" y="50" width="120" height="96" rx="6" fill="#bfe3f7" stroke="#fff" stroke-width="8"/><path d="M90 50v96M30 98h120" stroke="#fff" stroke-width="6"/><circle cx="122" cy="72" r="12" fill="#f7d15e"/>`;
 if(nh('r_bunting'))o+=`<path d="M0 12Q320 60 640 12" stroke="#8a6d52" stroke-width="2" fill="none"/>`+[40,110,180,250,320,390,460,530,600].map((x,i)=>{const y=12+48*(1-Math.pow((x-320)/320,2))*.5;return `<path d="M${x-14} ${y}L${x+14} ${y+1}L${x} ${y+26}Z" fill="${['#ef7fae','#8fd3f4','#f5cb63','#9ad28a'][i%4]}"/>`;}).join('');
 if(nh('r_moon'))o+=E(185,52,34,'🌙');
 if(nh('r_rainbow'))o+=`<rect x="222" y="30" width="72" height="56" rx="4" fill="#fff" stroke="#e0d2bd" stroke-width="3"/>`+E(258,60,40,'🌈');
 if(nh('r_clock'))o+=E(335,62,42,'🕰️');
 if(nh('r_mirror'))o+=E(420,140,58,'🪞');
 if(nh('r_picture'))o+=E(525,86,62,'🖼️');
 if(nh('r_lantern'))o+=`<path d="M470 0v28" stroke="#8a6d52" stroke-width="2"/>`+E(470,48,38,'🏮');
 if(nh('r_books'))o+=E(606,220,64,'📚');
 if(nh('r_couch'))o+=E(500,262,96,'🛋️');
 if(nh('r_bed'))o+=E(78,268,120,'🛏️');
 if(nh('r_plant'))o+=E(28,340,56,'🪴');
 if(nh('r_rug'))o+=`<ellipse cx="200" cy="372" rx="150" ry="26" fill="#d98da5"/><ellipse cx="200" cy="372" rx="118" ry="17" fill="none" stroke="#f3c2d1" stroke-width="4"/>`;
 o+=spSceneItems(m,'home');
 if(inner)o+=`<g transform="translate(40 85) scale(.8)">${inner}</g>`;
 Object.entries(SP_FAMILY).forEach(([k,f])=>{if(!nh(k))return;const [x,y,sc]=f.at;
  o+=f.emoji?E(x,y-18,52,f.emoji):`<g transform="translate(${x-200*sc} ${y-350*sc}) scale(${sc})">${spMonsterInner(f.look)}</g>`;});
 Object.keys(SP_PARTS).filter(k=>SP_PARTS[k].cat==='toy').forEach((k,i)=>{if(nh(k))o+=E(22+i*40,402+(i%2)*6,38,SP_PARTS[k].icon);});
 return o;
}
function spWorldSvg(m,inner,rooms,sel){
 const label=(x,y,pl,on)=>`<rect x="${x+8}" y="${y+8}" width="${pl==='home'?150:170}" height="34" rx="17" fill="${on?'#28634d':'#ffffffd9'}"/>`+`<text x="${x+22}" y="${y+31}" font-size="18" font-weight="800" fill="${on?'#fff':'#253e37'}" font-family="system-ui,sans-serif">${SP_PLACES[pl].icon} ${SP_PLACES[pl].name}${on?' ✓':''}</text>`;
 let svg=`<g>${spRoomContent(m,sel,inner)}${label(0,0,sel,true)}<rect x="3" y="3" width="634" height="414" fill="none" stroke="#28634d" stroke-width="6" rx="6"/></g>`;
 const below=rooms.filter(pl=>pl!==sel);let h=420;

 below.forEach((pl,i)=>{const x=i%2*320,y=420+Math.floor(i/2)*214;h=y+214;
  svg+=`<g data-sp-room="${pl}"><svg x="${x+2}" y="${y+2}" width="316" height="210" viewBox="0 0 640 420">${spRoomContent(m,pl,'')}</svg>${label(x,y,pl,sel===pl)}<rect x="${x+2}" y="${y+2}" width="316" height="210" fill="none" stroke="${sel===pl?'#28634d':'#ffffff'}" stroke-width="${sel===pl?6:3}" rx="6"/></g>`;});
 return `<svg viewBox="0 0 640 ${h}" role="img" aria-label="Your monster's world">${svg}</svg>`;
}
const SP_BACKDROPS={
 yard:'<rect width="640" height="300" fill="#bfe6fb"/><ellipse cx="480" cy="310" rx="330" ry="60" fill="#b5dd92"/><rect y="300" width="640" height="120" fill="#9fd27e"/><path d="M0 300H640" stroke="#86bd64" stroke-width="4"/>',
 party:'<rect width="640" height="300" fill="#ffe3f0"/>'+[[60,60],[180,150],[300,40],[420,170],[540,70],[620,200],[120,240],[360,250]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="#ffc2dc"/>`).join('')+'<rect y="300" width="640" height="120" fill="#c9a7e8"/><path d="M0 300H640" stroke="#a987cc" stroke-width="6"/><rect x="370" y="300" width="250" height="14" rx="4" fill="#fff"/><path d="M390 314v40M600 314v40" stroke="#fff" stroke-width="8"/><path d="M0 14Q320 70 640 14" stroke="#8a6d52" stroke-width="2" fill="none"/>'+[60,160,260,360,460,560].map((x,i)=>`<path d="M${x-16} ${22+i%2*4}L${x+16} ${24}L${x} ${52}Z" fill="${['#ef7fae','#8fd3f4','#f5cb63'][i%3]}"/>`).join(''),
 space:'<rect width="640" height="420" fill="#1b2350"/>'+[[40,30],[90,150],[200,70],[260,190],[380,30],[470,140],[520,240],[600,160],[330,230],[150,250],[560,20],[20,220]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?2:3}" fill="#fff"/>`).join('')+'<ellipse cx="320" cy="390" rx="420" ry="110" fill="#9aa3b5"/><ellipse cx="120" cy="360" rx="40" ry="12" fill="#7f889b"/><ellipse cx="520" cy="395" rx="55" ry="14" fill="#7f889b"/>',
 castle:'<rect width="640" height="300" fill="#f6d9ef"/><circle cx="560" cy="60" r="30" fill="#fff3b0"/><rect y="300" width="640" height="120" fill="#a8d88a"/><path d="M0 300H640" stroke="#8cc36c" stroke-width="4"/>',
 sea:'<defs><linearGradient id="spSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6f2"/><stop offset="1" stop-color="#2f8fc6"/></linearGradient></defs><rect width="640" height="420" fill="url(#spSea)"/><path d="M0 330Q160 300 320 330T640 325V420H0Z" fill="#f1d9a0"/>'+[[250,200,6],[262,170,4],[256,145,3],[600,260,5],[590,230,3]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#ffffffaa" stroke-width="2"/>`).join('')
};

function spSpeakWord(){spSpeakCurrent();}
const spLastExtras={};
function spTiles(w){
 const pool=[...'abcdefghijklmnopqrstuvwxyz'].filter(l=>!w.includes(l)&&!(spLastExtras[w]||[]).includes(l));
 const extra=shuffle(pool).slice(0,w.length<=3?3:2);spLastExtras[w]=extra;
 return shuffle([...w,...extra]).map(l=>({l,used:false}));
}
function spSpeakCurrent(){const q=spProblem();speak(q?MATH_SAY.prompt(q):SP_SAY.prompt(spWord()));}
function spMathVisual(q,hint){
 const num=(n)=>hint?`<b>${n}</b>`:'';
 const frame=(cells)=>`<div class="tenframe">${cells.join('')}</div>`;
 const cell=(inner)=>`<span class="tf-cell">${inner||''}</span>`;
 if(q.kind==='missing'){const e=MATH_OBJ[q.o][0];return `<div class="mq-row"><div class="mq-group">${Array.from({length:q.a},()=>`<span class="mq-obj">${e}</span>`).join('')}</div><span class="mq-op">+</span><div class="mq-group more">${Array.from({length:q.b-q.a},(_,i)=>`<span class="mq-obj mq-empty">?${num(i+1)}</span>`).join('')}</div></div><div class="mq-note">makes ${q.b}</div>`;}
 if(q.kind==='make10'){let n=0;return `<div class="mq-frames">${frame(Array.from({length:10},(_,i)=>i<q.a?cell('<span class="mq-obj">⭐</span>'):cell(hint?`<span class="mq-obj mq-empty">${++n}</span>`:'')))}</div>`;}
 if(q.kind==='doubles'){const f=()=>frame(Array.from({length:10},(_,i)=>cell(i<q.a?'<span class="mq-obj">🍎</span>':'')));return `<div class="mq-frames">${f()}<span class="mq-op">+</span>${f()}</div>`;}
 if(q.kind==='sub20'){let n=0;const all=Array.from({length:20},(_,i)=>i<q.a?(i>=q.a-q.b?cell('<span class="mq-obj gone">🧁</span>'):cell(`<span class="mq-obj">🧁${num(++n)}</span>`)):cell(''));return `<div class="mq-frames">${frame(all.slice(0,10))}${frame(all.slice(10))}</div>`;}
 if(q.kind==='compare')return `<div class="mq-numcards"><span>${q.a}</span><span>${q.b}</span></div>`;
 if(q.kind==='skip')return `<div class="mq-numline">${q.seq.map((x,i)=>`<span class="${i===3?'q':''}">${i===3?'?':x}</span>`).join('<i>→</i>')}</div>`;
 if(q.kind==='next')return `<div class="mq-numline">${q.dir==='after'?`<span>${q.a}</span><i>→</i><span class="q">?</span>`:`<span class="q">?</span><i>→</i><span>${q.a}</span>`}</div>`;
 if(q.kind==='tens')return `<div class="mq-base10">${Array.from({length:q.a},(_,i)=>`<span class="rod">${'<i></i>'.repeat(10)}${hint?`<b>${(i+1)*10}</b>`:''}</span>`).join('')}<span class="ones">${Array.from({length:q.b},(_,i)=>`<i>${hint?i+1:''}</i>`).join('')}</span></div>`;
 if(q.kind==='time'){const ang=q.a%12*30-90,rad=ang*Math.PI/180,hx=100+45*Math.cos(rad),hy=100+45*Math.sin(rad);
  return `<svg class="mq-clock" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#253e37" stroke-width="8"/>${Array.from({length:12},(_,i)=>{const t=(i+1)*30-90,r=t*Math.PI/180;return `<text x="${100+72*Math.cos(r)}" y="${100+72*Math.sin(r)}" font-size="20" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#253e37" font-family="system-ui,sans-serif">${i+1}</text>`;}).join('')}<path d="M100 100L100 30" stroke="#5f86c4" stroke-width="6" stroke-linecap="round"/><path d="M100 100L${hx.toFixed(1)} ${hy.toFixed(1)}" stroke="#d9534f" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#253e37"/></svg>`;}
 if(q.kind==='shape'){let pts;if(q.name==='rectangle')pts='25,60 175,60 175,140 25,140';else{const n=q.a,rot=n===4?45:-90;pts=Array.from({length:n},(_,i)=>{const a=(rot+i*360/n)*Math.PI/180;return `${(100+80*Math.cos(a)).toFixed(1)},${(105+80*Math.sin(a)).toFixed(1)}`;}).join(' ');}
  return `<svg class="mq-shape" viewBox="0 0 200 200"><polygon points="${pts}" fill="#8fd3f4" stroke="#253e37" stroke-width="7" stroke-linejoin="round"/></svg>`;}
 if(q.kind==='measure'){const W=q.a*48,col={pencil:'#f5cb63',crayon:'#e05d5d',snake:'#5e9e4b',worm:'#e79aa8',train:'#3f7fd0',ribbon:'#ef7fae'}[q.name]||'#8fd3f4';
  const body=q.name==='pencil'||q.name==='crayon'?`<rect x="0" y="8" width="${W-34}" height="40" rx="6" fill="${col}" stroke="#253e37" stroke-width="3"/><path d="M${W-34} 8L${W-2} 28L${W-34} 48Z" fill="#f3d9b1" stroke="#253e37" stroke-width="3"/>`:`<rect x="1" y="8" width="${W-2}" height="40" rx="20" fill="${col}" stroke="#253e37" stroke-width="3"/>`;
  return `<div class="mq-measure"><div class="mq-label">${q.e} ${q.name}</div><svg width="${W}" height="56" viewBox="0 0 ${W} 56" style="display:block">${body}</svg><div class="mq-cubes">${Array.from({length:q.a},(_,i)=>`<i>${hint?i+1:''}</i>`).join('')}</div></div>`;}
 if(q.kind==='tally'){const groups=Math.floor(q.a/5),rest=q.a%5;let o='',x=10;
  for(let g=0;g<groups;g++){for(let i=0;i<4;i++)o+=`<path d="M${x+i*14} 20V100" stroke="#253e37" stroke-width="7" stroke-linecap="round"/>`;o+=`<path d="M${x-6} 90L${x+48} 30" stroke="#d9534f" stroke-width="7" stroke-linecap="round"/>`;if(hint)o+=`<text x="${x+21}" y="128" font-size="22" font-weight="900" text-anchor="middle" fill="#28634d" font-family="system-ui,sans-serif">${(g+1)*5}</text>`;x+=80;}
  for(let i=0;i<rest;i++)o+=`<path d="M${x+i*14} 20V100" stroke="#253e37" stroke-width="7" stroke-linecap="round"/>`;
  return `<svg class="mq-tally" viewBox="0 0 ${x+rest*14+20} 140">${o}</svg>`;}
 const e=MATH_OBJ[q.o][0],item=(i,cls)=>`<span class="mq-obj ${cls||''}">${e}${hint&&cls!=='gone'?`<b>${i}</b>`:''}</span>`;
 if(q.kind==='count'){const cells=(from,count)=>Array.from({length:10},(_,i)=>`<span class="tf-cell">${i<count?item(from+i):''}</span>`).join('');
  return `<div class="mq-frames"><div class="tenframe">${cells(1,10)}</div><div class="tenframe">${cells(11,q.a-10)}</div></div>`;}
 if(q.op==='+')return `<div class="mq-row"><div class="mq-group">${Array.from({length:q.a},(_,i)=>item(i+1)).join('')}</div><span class="mq-op">+</span><div class="mq-group more">${Array.from({length:q.b},(_,i)=>item(q.a+i+1)).join('')}</div></div>`;
 if(q.op==='more'){let n=0;const row=(count,extra)=>`<div class="mq-group mq-line">${Array.from({length:count},(_,i)=>i>=q.b&&extra?`<span class="mq-extra">${item(++n)}</span>`:`<span class="mq-obj">${e}</span>`).join('')}</div>`;
  return `<div class="mq-compare">${row(q.a,true)}${row(q.b,false)}</div>`;}
 return `<div class="mq-row"><div class="mq-group">${Array.from({length:q.a},(_,i)=>i>=q.a-q.b?item(0,'gone'):item(i+1)).join('')}</div></div>`;
}
function renderSpell(){
 const s=ensureSpell(),w=spWord(),q=spProblem(),m=s.monster,isMath=!!q,total=s.order.length;
 const done=s.phase==='roundDone'?s.round:s.round-1;
 $('#spRound').innerHTML=`<strong>Round ${s.round} · ${s.kind==='story'?'📖 Story problems':isMath?'🔢 Math':'🔤 Spelling'}</strong><span>${s.phase==='roundDone'?'Round done!':`${isMath?'Problem':'Word'} ${s.pos+1} of ${total}`}</span>`;
 $('#spBadges').innerHTML=done>0?`<span>Medals:</span> ${Array.from({length:done},(_,i)=>`<i>${MATH_MEDALS[i%MATH_MEDALS.length]}</i>`).join('')}`:'<span>Finish a round to earn a medal!</span>';
 const places=spPlacesOf(m);
 const rooms=spRoomsFor(spM(m),s.round),sel=m.room||'home';
 $('#spPlaces').innerHTML=rooms.length?`<span>Move my monster to:</span>${rooms.map(pl=>`<button data-sp-place="${pl}" class="${sel===pl?'on':''}">${SP_PLACES[pl].icon} ${SP_PLACES[pl].name}</button>`).join('')}`:'';
 $('#spDots').innerHTML=s.order.map((_,i)=>`<i class="${i<s.pos||s.phase==='roundDone'||(i===s.pos&&s.phase==='pick')?'done':i===s.pos?'now':''}"></i>`).join('');
 $('#spMonster').innerHTML=spellMonster(m);
 $('#spPartsCount').textContent=`👾 ${spPartCount(m)} monster parts`+(s.phase==='roundDone'?'':' · Finish this round to earn a medal!');
 const saved=Number.isInteger(s.savedIdx)&&s.shelf[s.savedIdx];
 $('#spSave').textContent=saved?`✓ Saved as ${saved.name}`:'💾 Save my monster';$('#spSave').classList.toggle('is-saved',!!saved);
 $('#spShelf').innerHTML=s.shelf.length?s.shelf.map((x,i)=>`<button data-sp-load="${i}" class="${i===s.savedIdx?'current':''}">${spellMonster(i===s.savedIdx?m:x.monster)}<span>${escapeHTML(x.name)}</span><small>${i===s.savedIdx?'Building now':'Keep building'}</small></button>`).join(''):'<p>Tap 💾 Save to put your monster here.</p>';
 const [ti,tl]=w?SP_TYPES[w.type]:['',''],chip=w?`<div class="sp-type ${w.type}">${ti} ${tl}</div>`:'';
 const blank=w?w.say.replaceAll('{w}','<span class="sp-blank">_____</span>'):'',shown=w?w.say.replace(/^\{w\}/,`<b>${w.w[0].toUpperCase()+w.w.slice(1)}</b>`).replaceAll('{w}',`<b>${w.w}</b>`):'';
 const card=$('#spCard');
 if(s.phase==='look'){
  if(!spRun||spRun.key!==`look${s.round}-${s.pos}`)spRun={key:`look${s.round}-${s.pos}`,seen:[]};
  const all=spRun.seen.length===w.w.length;
  card.innerHTML=`${chip}<div class="sp-pic">${w.pic}</div><p class="sp-sentence">${shown}</p><h3>A memory word can’t be sounded out. Let’s look closely!</h3><div class="sp-look">${[...w.w].map((l,i)=>`<button data-sp-look="${i}" class="${(w.tricky||[]).includes(i)?'tricky':''} ${spRun.seen.includes(i)?'seen':''}" ${i>spRun.seen.length?'disabled':''}>${l}</button>`).join('')}</div><p class="sp-note">${all?'Great looking! Say the letters one more time, then hide the word.':'Tap each letter, in order, to read it. <span class="tricky-key">Orange</span> letters are the tricky part.'}</p><div class="sp-tip">💡 ${w.tip}</div><div class="sp-actions"><button class="audio" id="spHear">🔊 Hear it</button><button id="spTipSay" class="audio">💡 Hear the trick</button>${all?'<button class="primary" id="spHide">I remember it! Hide the word →</button>':''}</div>`;
 }else if(s.phase==='spell'){
  const key=`spell${s.round}-${s.pos}`;
  if(!spRun||spRun.key!==key)spRun={key,tiles:spTiles(w.w),got:0,wrong:0};
  card.innerHTML=`${chip}<div class="sp-pic">${w.pic}</div><p class="sp-sentence">${blank}</p><div class="sp-slots">${[...w.w].map((l,i)=>`<span class="${i<spRun.got?'filled':i===spRun.got?'next':''}">${i<spRun.got?l:''}</span>`).join('')}</div><div class="sp-tiles">${spRun.tiles.map((t,i)=>`<button data-sp-tile="${i}" ${t.used?'disabled':''}>${t.l}</button>`).join('')}</div><div class="sp-feedback" id="spFeedback" role="status">${spRun.wrong>=2?`💡 ${w.tip}`:'Tap the letters in order.'}</div><div class="sp-actions"><button class="audio" id="spHear">🔊 Hear it</button><button class="audio" id="spPeek">👀 Peek</button></div>`;
 }else if(s.phase==='math'){
  const key=`math${s.round}-${s.pos}`,ans=mathAnswer(q);
  if(!spRun||spRun.key!==key)spRun={key,wrong:0,tried:[],choices:mathChoices(q)};
  const eq=mathEq(q),lab=mathLabel(q);
  card.innerHTML=`<div class="sp-type math">${lab[0]} ${lab[1]}</div>${q.kind==='word'?`<p class="sp-sentence mq-story">${q.text}</p>`:''}${spMathVisual(q,spRun.wrong>=2)}${eq?`<div class="mq-eq">${eq}</div>`:''}<div class="mq-answers">${spRun.choices.map(c=>`<button data-sp-num="${c}" ${spRun.tried.includes(String(c))?'disabled':''}>${c}</button>`).join('')}</div><div class="sp-feedback" id="spFeedback" role="status">${spRun.wrong>=2?`💡 ${MATH_SAY.hint(q).replace(' | ',' ')}`:'Tap the answer.'}</div><div class="sp-actions"><button class="audio" id="spHear">🔊 Hear it</button></div>`;
 }else if(s.phase==='pick'){
  if(Array.isArray(s.choices))s.choices=s.choices.filter(k=>k==='paint'||SP_PARTS[k]);
  if(!Array.isArray(s.choices)||!s.choices.length)s.choices=spMakeChoices();
  card.innerHTML=`<div class="sp-win"><div class="sp-bigword">${q?mathDoneText(q):w.w}</div><h2>🎉 ${q?'You got it!':'You spelled it!'}</h2><p>Pick a reward to add${spRoomsFor(m,s.round).length?` · it goes in <b>${SP_PLACES[m.room||'home'].icon} ${SP_PLACES[m.room||'home'].name}</b>`:''}:</p></div><div class="sp-choices">${s.choices.map(k=>`<button data-sp-part="${k}"><span class="sp-big">${k==='paint'?'🎨':SP_PARTS[k].icon}</span>${SP_PARTS[k]&&(SP_PARTS[k].cat==='town'||SP_PARTS[k].cat==='people')?spTownItemPreview(k):spellMonster(spWithPart(spM(m),k))}<span class="sp-cat">${SP_CATS[SP_PARTS[k].cat].name}</span><strong>${SP_PARTS[k].icon} ${SP_PARTS[k].name}</strong></button>`).join('')}</div>`;
 }else{
  const ch=spChapter(s.round),unlock=SP_CHAPTERS[s.round],nextKind=s.kind==='math'?'story':'math';
  card.innerHTML=`<div class="sp-win"><div class="sp-trophy">🏆</div><h2>Round ${s.round} done!</h2><p>${s.kind==='story'?`You solved all ${total} story problems`:isMath?`You solved all ${total} math problems`:`You spelled all ${SPELL_WORDS.length} words`} and built ${spPartCount(m)} things!</p><div class="sp-badge-earned">You earned a medal: <b>${MATH_MEDALS[(s.round-1)%MATH_MEDALS.length]}</b></div><button class="primary" id="spAgain">${nextKind==='math'?'Next: 🔢 Math round →':nextKind==='story'?'Next: 📖 Story problems →':'Next: 🔤 Spelling round →'}</button>${isMath?'':`<div class="sp-review">${SPELL_WORDS.map(x=>`<span>${x.pic} ${x.w}</span>`).join('')}</div>`}</div>`;
 }
 const on=(id,f)=>{const e=$('#'+id);if(e)e.onclick=f;};
 on('spHear',spSpeakWord);
 on('spTipSay',()=>w&&speak(SP_SAY.tip(w)));
 on('spHide',()=>{s.phase='spell';spRun=null;spPersist();renderSpell();spSpeakWord();});
 on('spPeek',()=>{const slots=$('.sp-slots');slots.classList.add('peek');slots.dataset.word=w.w;speak(SP_SAY.word(w));setTimeout(()=>slots.classList.remove('peek'),2500);});
 on('spAgain',()=>{spNextRound(s);spPersist();renderSpell();spSpeakCurrent();});
 on('spSaveNew',spSaveAndNew);
 on('spFillBuilding',spOpenBuildingPicker);
}
function spSaveAndNew(){
 const s=ensureSpell();
 if(spPartCount(s.monster)&&!spSaveCurrent(false))return;
 spSyncSaved();s.monster=newSpellMonster();s.savedIdx=null;if(s.phase==='roundDone')spNextRound(s);
 s.choices=null;spRun=null;spPersist();renderSpell();toast('Your monster is on the shelf. A brand-new monster is ready!');
}
function spChooseRoom(pl){const s=state.spell;if(!SP_PLACES[pl])return;s.monster={...s.monster,room:pl};s.choices=s.phase==='pick'?s.choices:null;spPersist();renderSpell();toast(`Your monster moved to ${SP_PLACES[pl].icon} ${SP_PLACES[pl].name}!`);}
document.addEventListener('click',e=>{const g=e.target.closest('#spMonster [data-sp-room]');if(g)spChooseRoom(g.dataset.spRoom);});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||!$('#spell').contains(b))return;
 const s=state.spell,w=spWord(),q=spProblem();
 if(b.dataset.spPlace){spChooseRoom(b.dataset.spPlace);return;}
 if(b.dataset.spNum!==undefined&&q&&s.phase==='math'){
  const v=String(b.dataset.spNum);
  if(v===String(mathAnswer(q))){s.phase='pick';s.choices=spMakeChoices();s.solved=(s.solved||0)+1;state.stars++;$('#stars').textContent=state.stars;spPersist();renderSpell();setTimeout(()=>speak(MATH_SAY.win(q)),300);}
  else{spRun.wrong++;spRun.tried.push(v);b.classList.add('shake');if(spRun.wrong>=2){renderSpell();speak(MATH_SAY.hint(q));}else{$('#spFeedback').textContent='Not that one. Try again!';b.disabled=true;speak(SP_SAY.tryAgain());}}
  return;
 }
 if(b.dataset.spLook!==undefined){const i=Number(b.dataset.spLook);if(!spRun.seen.includes(i))spRun.seen.push(i);speak(SP_SAY.letter(w.w[i]));renderSpell();if(spRun.seen.length===w.w.length)setTimeout(()=>speak(SP_SAY.spellOut(w)),700);}
 if(b.dataset.spTile!==undefined){
  const t=spRun.tiles[Number(b.dataset.spTile)];if(t.used)return;
  if(t.l===w.w[spRun.got]){t.used=true;spRun.got++;spRun.wrong=0;speak(SP_SAY.letter(t.l));
   if(spRun.got===w.w.length){s.phase='pick';s.choices=spMakeChoices();s.words=(s.words||0)+1;state.stars++;$('#stars').textContent=state.stars;spPersist();renderSpell();setTimeout(()=>speak(SP_SAY.win(w)),600);return;}
   renderSpell();
  }else{spRun.wrong++;b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');
   const fb=$('#spFeedback');
   if(spRun.wrong>=2){const right=[...$$('[data-sp-tile]')].find(x=>{const tt=spRun.tiles[Number(x.dataset.spTile)];return !tt.used&&tt.l===w.w[spRun.got];});if(right)right.classList.add('glow');fb.innerHTML=`💡 ${w.tip}`;speak(SP_SAY.tip(w));}
   else{fb.textContent='Not that one. Try again!';speak(SP_SAY.tryAgain());}
  }
 }
 if(b.dataset.spLoad!==undefined){const i=Number(b.dataset.spLoad);if(i===s.savedIdx||!s.shelf[i])return;if(spPartCount(s.monster))spSaveCurrent(false);spSyncSaved();s.monster=JSON.parse(JSON.stringify(s.shelf[i].monster));s.savedIdx=i;s.choices=null;spPersist();renderSpell();toast(`Let’s keep building ${s.shelf[i].name}!`);return;}
 if(b.dataset.spPart){const k=b.dataset.spPart;if(SP_PARTS[k]&&(SP_PARTS[k].cat==='town'||SP_PARTS[k].cat==='people')){s.town={...s.town,buildings:[...(s.town.buildings||[]),k]};}else if(spIsWorld(k)){const mm=spWithPart(spM(s.monster),k),W={parts:{},where:mm.where||{},walls:mm.walls||{}};Object.keys(mm.parts).forEach(x=>{if(spIsWorld(x))W.parts[x]=mm.parts[x];});s.world=W;if(mm.room)s.monster={...s.monster,room:mm.room};}else s.monster=spWithPart(s.monster,k);s.choices=null;s.pos++;
  s.phase=s.pos>=s.order.length?'roundDone':spStartPhase();if(s.phase==='roundDone'){s.buildTokens=(s.buildTokens||0)+3;s.monster={...s.monster,level:spLevel(s.monster)+1};}spRun=null;spPersist();renderSpell();
  const mon=$('#spMonster');mon.classList.add('pop');setTimeout(()=>mon.classList.remove('pop'),700);
  if(s.phase==='roundDone')speak(s.kind==='story'?SP_SAY.storyDone():spIsMath(s)?SP_SAY.mathDone():SP_SAY.roundDone());else setTimeout(spSpeakCurrent,500);}
});
$('#spNew').onclick=()=>{if(confirm('Put this monster on your shelf and start a new one?'))spSaveAndNew();};
$('#spSave').onclick=()=>{const s=ensureSpell();const was=Number.isInteger(s.savedIdx)&&s.shelf[s.savedIdx];if(!spSaveCurrent(!was))return;spPersist();renderSpell();toast(`💾 ${s.shelf[s.savedIdx].name} is saved!`);};
function spHasProgress(x){return !!(x&&(spPartCount(x.monster||{parts:{}})||(x.shelf||[]).length||x.pos||x.words||x.round>1));}
if(spHasProgress(state.spell)&&!state.spell.updatedAt){state.spell.updatedAt=Date.now();persist();}
/* Monster Math runs without the Mac, so progress is saved only in this browser. */
/* ===== My house & my town (optional). A house holds a monster's rooms; the town holds every monster's house. ===== */
const SP_HOUSES={
 cottage:{name:'Cozy cottage',icon:'🏠',roof:'tri',roofC:'#d9534f',wallC:'#fbe7c6',top:''},
 garden:{name:'Garden house',icon:'🏡',roof:'tri',roofC:'#5f86c4',wallC:'#ffffff',top:'🌷'},
 castle:{name:'Castle',icon:'🏰',roof:'castle',roofC:'#9aa0a6',wallC:'#cfd4da',top:'🚩'},
 tree:{name:'Treehouse',icon:'🌳',roof:'tree',roofC:'#5e9e4b',wallC:'#c8935a',top:'🐦'},
 mushroom:{name:'Mushroom house',icon:'🍄',roof:'dome',roofC:'#e0463f',wallC:'#fff4dc',top:'',spots:true},
 igloo:{name:'Igloo',icon:'🧊',roof:'dome',roofC:'#dff2fb',wallC:'#f5fbff',top:'❄️'},
 candy:{name:'Candy house',icon:'🍭',roof:'tri',roofC:'#f28fb8',wallC:'#fff0f6',top:'🍭'},
 space:{name:'Space dome',icon:'🚀',roof:'dome',roofC:'#bfe7ff',wallC:'#d9dde8',top:'📡'}
};
const SP_TOWNS={
 valley:{name:'Green valley',icon:'🌳',sky:'#bfe6fb',ground:'#9fd27e',road:'#b9a68c',deco:[['⛰️',150,190,150],['⛰️',760,200,120],['☁️',520,60,80],['🌳',40,360,70]]},
 beach:{name:'Beach town',icon:'🏖️',sky:'#a9e1f7',ground:'#f1d9a0',road:'#d9c08a',deco:[['☀️',880,60,80],['🌴',40,350,90],['🌊',480,300,70],['⛵',700,280,60]]},
 snowy:{name:'Snowy village',icon:'❄️',sky:'#dfeaf5',ground:'#ffffff',road:'#c9d4de',deco:[['🏔️',160,190,160],['🏔️',780,200,130],['⛄',40,370,70],['❄️',520,60,50]]},
 candy:{name:'Candy land',icon:'🍭',sky:'#ffd9ec',ground:'#f7b6d2',road:'#fff3a8',deco:[['🌈',480,90,130],['🍭',40,360,80],['🍬',900,370,60],['🧁',880,120,60]]},
 city:{name:'Big city',icon:'🏙️',sky:'#cfe3f3',ground:'#b9c3cc',road:'#6b7580',deco:[['🏙️',150,210,170],['🏙️',800,210,170],['🚕',470,300,50],['🚦',30,360,60]]},
 moon:{name:'Moon town',icon:'🌙',sky:'#1b2350',ground:'#9aa3b5',road:'#7f889b',deco:[['🪐',160,90,90],['🌍',820,80,70],['⭐',480,50,40],['🛸',640,150,60]]}
};
function spRoof(h,x,y,w,rh){
 const c=h.roofC,cx=x+w/2;let o='';
 if(h.roof==='tri')o=`<path d="M${x-14} ${y+rh}L${cx} ${y}L${x+w+14} ${y+rh}Z" fill="${c}"/>`;
 if(h.roof==='dome'){o=`<path d="M${x-6} ${y+rh}Q${x-6} ${y} ${cx} ${y}Q${x+w+6} ${y} ${x+w+6} ${y+rh}Z" fill="${c}"/>`;if(h.spots)o+=[[.3,.5],[.55,.3],[.75,.6]].map(([a,b])=>`<circle cx="${x+w*a}" cy="${y+rh*b}" r="${rh*.13}" fill="#fff"/>`).join('');}
 if(h.roof==='castle'){const t=w*.12;o=`<rect x="${x}" y="${y+rh*.45}" width="${w}" height="${rh*.55}" fill="${c}"/>`+[0,1,2,3,4].map(i=>`<rect x="${x+i*(w-t)/4}" y="${y+rh*.25}" width="${t}" height="${rh*.25}" fill="${c}"/>`).join('')+`<rect x="${x-t}" y="${y}" width="${t*1.4}" height="${rh}" fill="#8a9096"/><rect x="${x+w-t*.4}" y="${y}" width="${t*1.4}" height="${rh}" fill="#8a9096"/>`;}
 if(h.roof==='tree')o=[[.2,.65,.32],[.5,.45,.42],[.8,.65,.32]].map(([a,b,r])=>`<circle cx="${x+w*a}" cy="${y+rh*b}" r="${w*r*.5}" fill="${c}"/>`).join('');
 if(h.top)o+=spEmoji(cx,y-rh*.12,rh*.45,h.top);
 return o;
}
function spHouseExterior(h,x,y,w,H,m){
 const rh=H*.42,wy=y+rh,wh=H-rh;
 let o=h.roof==='tree'?`<rect x="${x+w*.42}" y="${wy+wh*.6}" width="${w*.16}" height="${wh*.4}" fill="#8a5a33"/>`:'';
 o+=`<rect x="${x}" y="${wy}" width="${w}" height="${h.roof==='tree'?wh*.65:wh}" fill="${h.wallC}" stroke="#00000022" stroke-width="2"/>`;
 o+=`<rect x="${x+w*.1}" y="${wy+wh*.15}" width="${w*.24}" height="${wh*.25}" fill="#bfe3f7" stroke="#fff" stroke-width="3"/><rect x="${x+w*.66}" y="${wy+wh*.15}" width="${w*.24}" height="${wh*.25}" fill="#bfe3f7" stroke="#fff" stroke-width="3"/>`;
 if(h.roof!=='tree')o+=`<rect x="${x+w*.4}" y="${wy+wh*.5}" width="${w*.2}" height="${wh*.5}" rx="6" fill="#8a5a33"/>`;
 o+=spRoof(h,x,y,w,rh);
 if(m){const sc=H/900;o+=`<g transform="translate(${x+w*.5-200*sc} ${y+H+6-350*sc}) scale(${sc})">${spMonsterInner(m)}</g>`;}
 return o;
}
function spHouseRooms(m){const all=spRoomsFor(spM(m),state.spell.round);return (m.house&&Array.isArray(m.house.rooms)?m.house.rooms.filter(r=>all.includes(r)):all);}
function spHouseCutaway(m){
 m=spM(m);
 const h=SP_HOUSES[m.house.style]||SP_HOUSES.cottage,rooms=spHouseRooms(m),rows=Math.max(1,Math.ceil(rooms.length/2));
 const top=170,H=top+rows*214+24,inner=spMonsterInner(m),cur=m.room||'home';
 let o=`<rect x="10" y="${top-10}" width="620" height="${H-top+10}" rx="10" fill="${h.wallC}" stroke="#00000022" stroke-width="3"/>`+spRoof(h,10,10,620,top-12);
 rooms.forEach((pl,i)=>{const x=20+i%2*302,y=top+Math.floor(i/2)*214;
  o+=`<g data-ov-room="${pl}" style="cursor:pointer"><svg x="${x}" y="${y}" width="298" height="200" viewBox="0 0 640 420">${spRoomContent(m,pl,pl===cur?inner:'')}</svg><rect x="${x}" y="${y}" width="298" height="200" fill="none" stroke="${pl===cur?'#28634d':'#ffffff'}" stroke-width="${pl===cur?6:3}"/><rect x="${x+6}" y="${y+6}" width="130" height="30" rx="15" fill="#ffffffe0"/><text x="${x+16}" y="${y+27}" font-size="16" font-weight="800" fill="#253e37" font-family="system-ui,sans-serif">${SP_PLACES[pl].icon} ${SP_PLACES[pl].name}</text></g>`;});
 if(!rooms.length)o+=`<text x="320" y="${top+110}" text-anchor="middle" font-size="26" fill="#253e37" font-family="system-ui,sans-serif">Pick rooms to put inside!</text>`;
 return `<svg viewBox="0 0 640 ${H}" role="img" aria-label="Inside my house">${o}</svg>`;
}
function spTownMonsters(){const s=state.spell,list=[];s.shelf.forEach((x,i)=>list.push({ref:String(i),name:x.name,m:i===s.savedIdx?s.monster:x.monster}));if(!Number.isInteger(s.savedIdx)||!s.shelf[s.savedIdx])list.push({ref:'cur',name:'My monster',m:s.monster});return list.filter(x=>x.m.house);}
/* Big town: a long street that grows as she adds buildings. Scale: houses ≈330 tall, big buildings up to 700, people ≈70. */
const SP_BUILDINGS={
 b_school:{w:340,h:380,c:'#e8b04b',roof:'tri',sign:'🏫',label:'SCHOOL',who:'👩‍🏫'},b_shop:{w:230,h:260,c:'#7cc5a8',roof:'awning',sign:'🏪',label:'SHOP',who:'🧑‍💼'},
 b_icecream:{w:210,h:240,c:'#f7b6d2',roof:'awning',sign:'🍦',label:'ICE CREAM',who:'🧑‍🍳'},b_fire:{w:310,h:320,c:'#d9534f',roof:'flat',sign:'🚒',label:'FIRE',who:'🧑‍🚒',garage:true},
 b_hospital:{w:330,h:500,c:'#f2f4f7',roof:'flat',sign:'🏥',label:'HOSPITAL',who:'👩‍⚕️'},b_library:{w:330,h:300,c:'#d8c9ad',roof:'tri',sign:'📚',label:'LIBRARY',who:'🧑‍🏫',columns:true},
 b_bakery:{w:220,h:250,c:'#f3d9b1',roof:'awning',sign:'🥐',label:'BAKERY',who:'🧑‍🍳'},b_hotel:{w:300,h:580,c:'#8fb3d9',roof:'flat',sign:'🏨',label:'HOTEL',who:'💁'},
 b_stadium:{w:480,h:250,c:'#9aa3b5',roof:'dome',sign:'🏟️',label:'STADIUM',who:'🏃'},b_train:{w:370,h:270,c:'#b5835a',roof:'tri',sign:'🚉',label:'TRAINS',who:'🧑‍✈️'},
 b_farm:{w:320,h:270,c:'#c0392b',roof:'tri',sign:'🚜',label:'FARM',who:'🧑‍🌾'},b_apartments:{w:270,h:640,c:'#b9a3d6',roof:'flat',sign:'🏢',label:'HOMES',who:'🧍‍♀️'},
 b_office:{w:280,h:720,c:'#7fa7c9',roof:'flat',sign:'🏬',label:'OFFICE',who:'🧑‍💼'},b_bank:{w:290,h:330,c:'#e6e0cf',roof:'tri',sign:'🏦',label:'BANK',who:'🧑‍💼',columns:true},
 b_post:{w:260,h:290,c:'#dfe8f3',roof:'flat',sign:'📮',label:'POST',who:'📬'},b_cinema:{w:330,h:330,c:'#3b3f58',roof:'flat',sign:'🎬',label:'MOVIES',who:'🍿'},
 b_pizza:{w:220,h:250,c:'#f5cb63',roof:'awning',sign:'🍕',label:'PIZZA',who:'🧑‍🍳'},b_toys:{w:240,h:260,c:'#8fd3f4',roof:'awning',sign:'🧸',label:'TOYS',who:'🧒'},
 b_pets:{w:230,h:250,c:'#a8d88a',roof:'awning',sign:'🐾',label:'PETS',who:'🐶'},b_police:{w:310,h:330,c:'#4a6fa5',roof:'flat',sign:'🚓',label:'POLICE',who:'👮'},
 b_museum:{w:370,h:350,c:'#dcd3c0',roof:'tri',sign:'🦖',label:'MUSEUM',who:'🧑‍🔬',columns:true},b_gas:{w:270,h:210,c:'#e05d5d',roof:'flat',sign:'⛽',label:'GAS',who:'👷'},
 b_flowers:{w:220,h:240,c:'#f6c1d9',roof:'awning',sign:'🌷',label:'FLOWERS',who:'👩‍🌾'},
 b_tower:{w:260,big:'🗼',size:560},b_ferris:{w:400,big:'🎡',size:440},b_carousel:{w:280,big:'🎠',size:260},b_playground:{w:280,big:'🛝',size:240},
 b_park:{w:320,big:'⛲',size:220,extra:[['🌳',-110,-60,150],['🌳',110,-60,150]]},b_bus:{w:260,big:'🚌',size:190},
 b_pond:{w:340,pond:true,big:'🦆',size:80},b_pool:{w:340,pond:true,big:'🏊',size:90},b_zoo:{w:420,big:'🦒',size:300,extra:[['🐘',130,40,200],['🦓',-140,50,150]]},b_castle:{w:460,big:'🏰',size:460}
};
function spBuilding(k,x,g){
 const b=SP_BUILDINGS[k];if(!b)return {w:180,o:spEmoji(x+90,g-80,150,SP_PARTS[k]?SP_PARTS[k].icon:'🏠')};
 let o='';const cx=x+b.w/2;
 if(b.big){
  if(b.pond)o+=`<ellipse cx="${cx}" cy="${g-30}" rx="${b.w/2}" ry="44" fill="#7fc8ee" stroke="#5aa9d6" stroke-width="6"/>`;
  (b.extra||[]).forEach(([e,dx,dy,sz])=>o+=spEmoji(cx+dx,g-sz/2+dy,sz,e));
  o+=spEmoji(cx,b.pond?g-40:g-b.size*.48,b.size,b.big);return {w:b.w,o};
 }
 const y=g-b.h,dark='#00000022';
 o+=`<rect x="${x}" y="${y}" width="${b.w}" height="${b.h}" fill="${b.c}" stroke="${dark}" stroke-width="3"/>`;
 if(b.roof==='tri')o+=`<path d="M${x-18} ${y+4}L${cx} ${y-Math.min(140,b.w*.35)}L${x+b.w+18} ${y+4}Z" fill="#8d5a4a"/>`;
 if(b.roof==='flat')o+=`<rect x="${x-8}" y="${y-18}" width="${b.w+16}" height="22" fill="#6b7580"/>`;
 if(b.roof==='dome')o+=`<path d="M${x} ${y+2}Q${cx} ${y-150} ${x+b.w} ${y+2}Z" fill="#c9d2dc"/>`;
 if(b.roof==='awning')o+=[0,1,2,3,4,5].map(i=>`<path d="M${x+i*b.w/6} ${y+56}h${b.w/6}l-6 36h-${b.w/6}Z" fill="${i%2?'#fff':'#e05d5d'}"/>`).join('');
 const rows=Math.max(1,Math.floor((b.h-190)/78)),cols=Math.max(2,Math.floor((b.w-40)/70));
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const wx=x+26+c*((b.w-52)/cols)+6,wy=y+(b.roof==='awning'?110:36)+r*78;if(wy+40<g-150)o+=`<rect x="${wx}" y="${wy}" width="${(b.w-52)/cols-12}" height="44" rx="4" fill="#cfe9fb" stroke="#fff" stroke-width="4"/>`;}
 if(b.columns)[.18,.38,.62,.82].forEach(f=>o+=`<rect x="${x+b.w*f-9}" y="${g-150}" width="18" height="150" fill="#fff" opacity=".85"/>`);
 o+=`<rect x="${cx-70}" y="${g-196}" width="140" height="42" rx="8" fill="#fff" stroke="${dark}" stroke-width="2"/><text x="${cx}" y="${g-167}" text-anchor="middle" font-size="${b.label.length>7?17:22}" font-weight="900" fill="#253e37" font-family="system-ui,sans-serif">${b.sign} ${b.label}</text>`;
 o+=b.garage?`<rect x="${cx-80}" y="${g-140}" width="160" height="140" fill="#f3f3f3" stroke="#bbb" stroke-width="4"/><path d="M${cx-80} ${g-105}h160M${cx-80} ${g-70}h160M${cx-80} ${g-35}h160" stroke="#ccc" stroke-width="4"/>`:`<rect x="${cx-34}" y="${g-120}" width="68" height="120" rx="8" fill="#8a5a33"/><circle cx="${cx+20}" cy="${g-60}" r="5" fill="#f5cb63"/>`;
 o+=spEmoji(cx+b.w/2-34,g-40,70,b.who);
 return {w:b.w,o};
}
function spTownSvg(town,opts){
 opts=opts||{};const t=SP_TOWNS[town.style]||SP_TOWNS.valley,homes=spTownMonsters(),G=600,H=900;
 const lots=[...homes.map(x=>({home:x})),...(town.buildings||[]).filter(k=>SP_PARTS[k]&&SP_PARTS[k].cat==='town').map(k=>({k}))];
 let x=80,body='';
 lots.forEach(lot=>{
  if(lot.home){const h=SP_HOUSES[lot.home.m.house.style]||SP_HOUSES.cottage,w=230;
   body+=`<g data-ov-house="${lot.home.ref}" style="cursor:pointer">${spHouseExterior(h,x,G-330,w,330,lot.home.m)}<rect x="${x+w/2-100}" y="${G+50}" width="200" height="38" rx="19" fill="#ffffffe6"/><text x="${x+w/2}" y="${G+77}" text-anchor="middle" font-size="24" font-weight="900" fill="#253e37" font-family="system-ui,sans-serif">${escapeHTML(lot.home.name)}</text></g>`;x+=w+70;}
  else{const r=spBuilding(lot.k,x,G);const n=(town.inside&&town.inside[lot.k]||[]).length;body+=`<g data-ov-building="${lot.k}" style="cursor:pointer">${r.o}${n?`<circle cx="${x+28}" cy="${G-24}" r="22" fill="#28634d"/><text x="${x+28}" y="${G-16}" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">${n}</text>`:''}</g>`;x+=r.w+70;}
 });
 const W=Math.max(1600,x+80);
 let o=`<rect width="${W}" height="${G}" fill="${t.sky}"/><rect y="${G-10}" width="${W}" height="${H-G+10}" fill="${t.ground}"/>`;
 for(let i=0;i*960<W;i++)t.deco.forEach(([e,dx,dy,sz])=>o+=spEmoji(dx+i*960,dy*1.1,sz*1.5,e));
 o+=`<rect y="${G}" width="${W}" height="36" fill="#d9d4c7"/><rect y="${G+100}" width="${W}" height="96" fill="${t.road}"/><path d="M0 ${G+148}H${W}" stroke="#ffffffcc" stroke-width="6" stroke-dasharray="40 30"/><rect y="${G+196}" width="${W}" height="30" fill="#d9d4c7"/>`;
 for(let tx=140;tx<W;tx+=420)o+=spEmoji(tx,G+280,120,'🌳');
 o+=body;
 // people: rewards first, then friendly walkers so the town feels alive
 const people=[...(town.buildings||[]).filter(k=>SP_PARTS[k]&&SP_PARTS[k].cat==='people').map(k=>SP_PARTS[k].icon),...(town.folk||[])];
 const walkers=['🚶‍♀️','🧒','🚶','👫','🧍‍♀️','🚶‍♂️','👧','🧑‍🦯','👨‍👧'];
 const n=Math.max(people.length,Math.floor(lots.length*1.2));
 for(let i=0;i<n;i++){const e=i<people.length?people[i]:walkers[i%walkers.length];o+=spEmoji(110+((i*277)%Math.max(300,W-160)),i%2?G+22:G+250,72,e);}
 Object.keys(((state.spell&&state.spell.world)||{}).parts||{}).filter(k=>SP_PARTS[k]&&SP_PARTS[k].cat==='car').forEach((k,i)=>o+=spEmoji(140+i*190,G+140+(i%2)*14,80,SP_PARTS[k].icon));
 const vw=opts.thumb?Math.min(W,1300):W;
 return `<svg viewBox="0 0 ${vw} ${H}" ${opts.thumb?'':`width="${Math.round(W*560/H)}" height="560"`} role="img" aria-label="My town">${o}</svg>`;
}
function spTownItemPreview(k){
 if(SP_PARTS[k].cat==='people')return `<svg viewBox="0 0 400 400"><rect width="400" height="300" fill="#bfe6fb"/><rect y="300" width="400" height="100" fill="#d9d4c7"/>${spEmoji(200,210,200,SP_PARTS[k].icon)}</svg>`;
 const r=spBuilding(k,60,760);const W=r.w+120;
 return `<svg viewBox="0 0 ${W} 800"><rect width="${W}" height="760" fill="#bfe6fb"/><rect y="760" width="${W}" height="40" fill="#9fd27e"/>${r.o}</svg>`;
}
/* Inside town buildings: every finished round wins 3 things to put inside any building. */
const SP_INSIDE={
 b_school:['✏️','📚','🌍','🎒','🍎','🕰️','🖍️','📏','🔬','🎨','🧮','🪑','🔤','🧑‍🎓'],b_shop:['🛒','🍞','🥛','🍌','🧃','🥫','🍫','🧺','🏷️','🍉','🧀','🥕'],
 b_icecream:['🍦','🍨','🍧','🍒','🍫','🍓','🧁','🥤','🪑','🎈'],b_fire:['🧯','🪜','⛑️','🧑‍🚒','🐕','🔔','🪣','🚒','🔦'],
 b_hospital:['🛏️','🩺','🩹','💊','🧸','🌡️','🦽','💐','🩻','👩‍⚕️'],b_library:['📚','📖','📕','📗','📘','🪑','🛋️','💡','🌍','🔖','🐛'],
 b_bakery:['🍞','🥐','🥖','🥯','🧁','🎂','🍪','🥧','🍩','🥨','🧈'],b_hotel:['🛏️','🛎️','🧳','🛋️','🪴','🖼️','🛁','🗝️','🍽️','📺'],
 b_stadium:['⚽','🏀','🏈','⚾','🥅','🏆','📣','🎺','🍿','🌭'],b_train:['🚂','🚃','🎫','🧳','🕰️','🪑','🗺️','🥪'],
 b_farm:['🐄','🐖','🐑','🐓','🐴','🌽','🥕','🌾','🪣','🥚'],b_apartments:['🛋️','📺','🪴','🛏️','🖼️','🧸','🍳','🪑','🐈'],
 b_office:['💻','🖨️','📎','🗂️','☕','📞','🪑','🪴','📊'],b_bank:['💰','🪙','💵','🔐','🗝️','🖊️','🪴','🐷'],b_post:['📦','✉️','📮','📬','🏷️','🚚','🖊️'],
 b_cinema:['🍿','🎬','🎥','🎟️','🥤','🍫','🪑','📽️'],b_pizza:['🍕','🧀','🍅','🫒','🍄','🥤','🍽️','🧑‍🍳'],b_toys:['🧸','🪀','🪁','🚂','🎲','🧩','🤖','🪆','🎈','🦖'],
 b_pets:['🐶','🐱','🐹','🐰','🐠','🦜','🐢','🦴','🧶'],b_police:['🚓','🚨','🔦','👮','🐕‍🦺','🗺️','🔑','📻'],b_museum:['🦖','🦕','🦴','🗿','🏺','💎','🪐','🖼️','🔭'],
 b_gas:['⛽','🚗','🧃','🍫','🛞','🧰','🔧'],b_flowers:['🌷','🌹','🌻','🌼','💐','🌸','🪴','🌵','🌺'],
 b_zoo:['🦁','🐯','🐒','🐧','🦓','🐘','🦒','🐊','🦛'],b_pool:['🏊','🛟','🦆','🍉','🩱','🤿','🐳'],b_pond:['🦆','🐸','🐟','🪷','🌿','🐢'],b_park:['🌳','🌸','🦋','🪑','🐿️','🧺','🐦'],
 b_playground:['🛝','🧒','⚽','🪁','🏀','🦘','🪀'],b_ferris:['🎡','🍭','🎈','🍿','🎟️','🧁'],b_carousel:['🎠','🎶','🍭','🎈','🦄','🍿'],b_bus:['🧒','🎒','📚','🍎','🧃'],
 b_tower:['🔭','🗺️','📸','🎈','🌙'],b_castle:['👑','🛡️','🐉','🦄','🧙','💎','🕯️']
};
const SP_INSIDE_DEFAULT=['🪴','🖼️','🪑','🧸','🎈','💡'];
const SP_TOWNFOLK=['🧒','👧','👦','👩','👨','👵','👴','🧑‍🦱','👩‍🦰','🧔','👶','🧑‍🦳','💃','🕺','🤸','🧑‍🍳','👷','🧑‍🎨','🦸','🧚'];
function spInside(k){const t=state.spell.town;return (t&&t.inside&&t.inside[k])||[];}
function spBuildingInterior(k){
 const b=SP_BUILDINGS[k]||{},p=SP_PARTS[k]||{icon:'🏠',name:'Building'},items=spInside(k),outdoor=!!b.big;
 let o=outdoor?`<rect width="900" height="380" fill="#bfe6fb"/><rect y="370" width="900" height="190" fill="#9fd27e"/>${spEmoji(130,250,220,b.big||p.icon)}`
  :`<rect width="900" height="380" fill="${b.c||'#f3ead8'}"/><rect width="900" height="380" fill="#ffffff8c"/><rect y="370" width="900" height="190" fill="#dcb68c"/><path d="M0 370H900" stroke="#b98f63" stroke-width="8"/><path d="M0 430H900M0 490H900M150 370v60M420 430v60M690 370v60" stroke="#c9a176" stroke-width="3"/>`;
 if(!outdoor)o+=`<rect x="320" y="24" width="260" height="56" rx="12" fill="#fff" stroke="#00000022" stroke-width="3"/><text x="450" y="62" text-anchor="middle" font-size="28" font-weight="900" fill="#253e37" font-family="system-ui,sans-serif">${b.sign||p.icon} ${b.label||p.name}</text>`+(b.who?spEmoji(820,300,110,b.who):'');
 const slots=[...[90,180,270,360,450,540,630,720,810].map(x=>[x,488,84]),...[140,230,320,410,500,590,680].map(x=>[x,330,70]),...[170,280,390,500,610,720].map(x=>[x,170,62])];
 const start=outdoor?[0,1,2,3,4,5,6,7,8,11,12,13,14,15,17,18,19,20,21]:slots.map((_,i)=>i);
 items.forEach((e,i)=>{const s=slots[start[i%start.length]];o+=spEmoji(s[0],s[1],s[2],e);});
 if(!items.length)o+=`<text x="450" y="${outdoor?520:300}" text-anchor="middle" font-size="30" font-weight="800" fill="#253e37" font-family="system-ui,sans-serif">Empty inside! Win a round to add things.</text>`;
 return `<svg viewBox="0 0 900 560" role="img" aria-label="Inside the ${p.name}">${o}</svg>`;
}
const spOvItemChoices={};
function spOpenBuilding(k){
 const s=ensureSpell(),p=SP_PARTS[k];if(!p||!s.town)return;
 const have=spInside(k),theme=SP_INSIDE[k]||SP_INSIDE_DEFAULT,tokens=s.buildTokens||0;
 let choices=(spOvItemChoices[k]||[]).filter(e=>!have.includes(e));
 if(choices.length<6){const folk=shuffle(SP_TOWNFOLK.filter(e=>!choices.includes(e))).slice(0,choices.some(e=>SP_TOWNFOLK.includes(e))?0:2);choices=[...choices,...folk,...shuffle(theme.filter(e=>!have.includes(e)&&!choices.includes(e)))].slice(0,6);}
 if(!choices.length)choices=shuffle(SP_INSIDE_DEFAULT.concat(['⭐','🎁','🌈','🎀'])).slice(0,6);
 spOvItemChoices[k]=choices;
 spOverlay(`<h2>${p.icon} Inside the ${p.name}</h2><div class="ov-pic ov-inside">${spBuildingInterior(k)}</div>${tokens>0?`<div class="ov-tokens">✨ Pick <b>${tokens}</b> thing${tokens>1?'s':''} to add!</div><div class="ov-items">${choices.map(e=>`<button data-ov-additem="${e}">${e}</button>`).join('')}</div>`:'<p class="ov-hint">🏆 Finish a round to win 3 more things to add!</p>'}<div class="ov-actions"><button data-ov-town="1">← Back to my town</button>${tokens>0?'<button data-ov-buildings="1">🏢 Pick a different building</button>':''}</div>`);
 spOvBuilding=k;
}
let spOvBuilding=null,spOvFolk=[];
function spOpenBuildingPicker(){
 const s=ensureSpell();if(!s.town){spOpenTown();return;}
 const list=(s.town.buildings||[]).filter(k=>SP_PARTS[k]&&SP_PARTS[k].cat==='town');
 if(!list.length){spOverlay(`<h2>🏢 No buildings yet</h2><p>Win town buildings as rewards, then fill them up!</p><div class="ov-actions"><button data-ov-town="1">🏘️ Go to my town</button></div>`);return;}
 spOverlay(`<h2>✨ Pick a building to fill</h2><p>You have <b>${s.buildTokens||0}</b> things to add.</p><div class="ov-grid">${list.map(k=>`<button data-ov-building="${k}">${spTownItemPreview(k)}<strong>${SP_PARTS[k].icon} ${SP_PARTS[k].name}</strong><span class="ov-count">${spInside(k).length} inside</span></button>`).join('')}</div>`);
}
/* overlay screens */
function spOverlay(html){$('#spOverlayBody').innerHTML=html;$('#spOverlay').hidden=false;}
function spCloseOverlay(){$('#spOverlay').hidden=true;spPicking.house=spPicking.town=false;renderSpell();}
function spOpenHouse(){
 const s=ensureSpell(),m=s.monster,h=m.house;
 if(!h||spPicking.house){spOverlay(`<h2>🏡 Pick a house for your monster</h2><div class="ov-grid">${Object.entries(SP_HOUSES).map(([k,x])=>`<button data-ov-housestyle="${k}"><svg viewBox="0 0 200 200">${spHouseExterior(x,40,30,120,150)}</svg><strong>${x.icon} ${x.name}</strong></button>`).join('')}</div>`);return;}
 const all=spRoomsFor(spM(m),s.round),inside=spHouseRooms(m);
 spOverlay(`<h2>${SP_HOUSES[h.style].icon} My ${SP_HOUSES[h.style].name}</h2><p>Tap rooms to put them in your house. Tap a room picture to go there.</p><div class="ov-rooms">${all.length?all.map(pl=>`<button data-ov-houseroom="${pl}" class="${inside.includes(pl)?'on':''}">${inside.includes(pl)?'✓ ':''}${SP_PLACES[pl].icon} ${SP_PLACES[pl].name}</button>`).join(''):'<p>Finish round 1 to unlock rooms!</p>'}</div><div class="ov-pic">${spHouseCutaway(m)}</div><div class="ov-actions"><button data-ov-changehouse="1">🔄 Pick a different house</button><button class="primary" data-ov-town="1">🏘️ Go to my town →</button></div>`);
}
function spOpenTown(){
 const s=ensureSpell();
 if(!s.town||spPicking.town){spOverlay(`<h2>🏘️ Pick a town</h2><div class="ov-grid">${Object.entries(SP_TOWNS).map(([k,t])=>`<button data-ov-townstyle="${k}">${spTownSvg({style:k,buildings:[]},{thumb:true})}<strong>${t.icon} ${t.name}</strong></button>`).join('')}</div>`);return;}
 const homes=spTownMonsters();
 spOverlay(`<h2>${SP_TOWNS[s.town.style].icon} My ${SP_TOWNS[s.town.style].name}</h2><p>Tap a house or building to go inside.${(s.buildTokens||0)>0?` <b>✨ You have ${s.buildTokens} things to put inside buildings!</b>`:''}</p><div class="ov-town-scroll">${spTownSvg(s.town)}</div>${(s.buildTokens||0)>0?`<div class="ov-tokens">🧑 Add people to your streets:</div><div class="ov-items">${(spOvFolk=spOvFolk.length?spOvFolk:shuffle(SP_TOWNFOLK).slice(0,6)).map(e=>`<button data-ov-addperson="${e}">${e}</button>`).join('')}</div>`:''}<p class="ov-hint">👉 Swipe the town sideways to see all of it.</p><div class="ov-actions">${s.monster.house?'':'<button class="primary" data-ov-house="new">🏡 Pick a house for my monster</button>'}<button data-ov-changetown="1">🔄 Pick a different town</button></div>`);
}
let spOvHouseRef=null;const spPicking={house:false,town:false};
function spOpenHouseOf(ref){
 const s=state.spell;if(ref==='cur'||ref==='new'||Number(ref)===s.savedIdx){spOvHouseRef=null;spOpenHouse();return;}
 const x=s.shelf[Number(ref)];if(!x)return;spOvHouseRef=ref;
 spOverlay(`<h2>${SP_HOUSES[x.monster.house.style].icon} ${escapeHTML(x.name)}’s house</h2><p>Tap a room to play with ${escapeHTML(x.name)} there.</p><div class="ov-pic">${spHouseCutaway(x.monster)}</div><div class="ov-actions"><button data-ov-town="1">← Back to town</button></div>`);
}
document.addEventListener('click',e=>{
 const t=e.target.closest('#spOverlay [data-ov-housestyle],#spOverlay [data-ov-houseroom],#spOverlay [data-ov-changehouse],#spOverlay [data-ov-town],#spOverlay [data-ov-townstyle],#spOverlay [data-ov-changetown],#spOverlay [data-ov-house],#spOverlay [data-ov-room],#spOverlay [data-ov-building],#spOverlay [data-ov-additem],#spOverlay [data-ov-buildings],#spOverlay [data-ov-addperson],#spOverlayClose');
 if(!t)return;const s=state.spell,d=t.dataset;
 if(t.id==='spOverlayClose'){spCloseOverlay();return;}
 if(d.ovBuilding){spOpenBuilding(d.ovBuilding);return;}
 if(d.ovBuildings){spOpenBuildingPicker();return;}
 if(d.ovAddperson&&(s.buildTokens||0)>0){s.town={...s.town,folk:[...(s.town.folk||[]),d.ovAddperson]};s.buildTokens--;spOvFolk=spOvFolk.filter(e=>e!==d.ovAddperson);spPersist();const sc=$('.ov-town-scroll'),left=sc?sc.scrollLeft:0;spOpenTown();const sc2=$('.ov-town-scroll');if(sc2)sc2.scrollLeft=left;return;}
 if(d.ovAdditem&&spOvBuilding&&(s.buildTokens||0)>0){const k=spOvBuilding;s.town={...s.town,inside:{...(s.town.inside||{}),[k]:[...spInside(k),d.ovAdditem]}};s.buildTokens--;spOvItemChoices[k]=(spOvItemChoices[k]||[]).filter(e=>e!==d.ovAdditem);spPersist();spOpenBuilding(k);if(!s.buildTokens)toast('All added! Tap buildings in your town to visit them.');return;}
 if(d.ovHousestyle){spPicking.house=false;s.monster={...s.monster,house:{style:d.ovHousestyle,rooms:s.monster.house?s.monster.house.rooms:spRoomsFor(spM(s.monster),s.round)}};spPersist();spOpenHouse();return;}
 if(d.ovChangehouse){spPicking.house=true;spOpenHouse();return;}
 if(d.ovHouseroom){const inside=spHouseRooms(s.monster),pl=d.ovHouseroom;const rooms=inside.includes(pl)?inside.filter(r=>r!==pl):[...inside,pl];s.monster={...s.monster,house:{...s.monster.house,rooms}};spPersist();spOpenHouse();return;}
 if(d.ovTown){spOpenTown();return;}
 if(d.ovTownstyle){spPicking.town=false;s.town={style:d.ovTownstyle,buildings:(s.town&&s.town.buildings)||[]};spPersist();spOpenTown();return;}
 if(d.ovChangetown){spPicking.town=true;spOpenTown();return;}
 if(d.ovHouse){spOpenHouseOf(d.ovHouse);return;}
 if(d.ovRoom){
  if(spOvHouseRef!==null){const i=Number(spOvHouseRef);if(spPartCount(s.monster))spSaveCurrent(false);spSyncSaved();s.monster=JSON.parse(JSON.stringify(s.shelf[i].monster));s.savedIdx=i;spOvHouseRef=null;}
  s.monster={...s.monster,room:d.ovRoom};spPersist();spCloseOverlay();toast(`Your monster is in ${SP_PLACES[d.ovRoom].icon} ${SP_PLACES[d.ovRoom].name}!`);
 }
});
$('#spHouseBtn').onclick=spOpenHouse;$('#spTownBtn').onclick=spOpenTown;
ensureSpell();renderSpell();
