// Art and sound pass: drawn icons plus game-made sound. No files are downloaded and the engine is never touched.
const SECTOR_ICON_PATHS={
 publishing:'<path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-7v14a2 2 0 0 1 2-2h5z"/>',
 movie:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/>',
 tv:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M9 21h6M8 3l4 3 4-3"/>',
 games:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5M15.5 11h.01M18 14h.01"/>'
};
function sectorIcon(key){const p=SECTOR_ICON_PATHS[key];return p?`<svg class="sector-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`:'';}

const AUDIO_KEY='studio-syndicate-audio';
const AUDIO_DEFAULTS={sfx:0.3,music:0,muted:false};
let audioPrefs=(()=>{try{const v=JSON.parse(localStorage.getItem(AUDIO_KEY)||'null');if(v&&typeof v==='object')return {sfx:clampVol(v.sfx,AUDIO_DEFAULTS.sfx),music:clampVol(v.music,AUDIO_DEFAULTS.music),muted:!!v.muted};}catch(_){}return {...AUDIO_DEFAULTS};})();
function clampVol(v,d){v=Number(v);return Number.isFinite(v)?Math.min(1,Math.max(0,v)):d;}
function saveAudioPrefs(){try{localStorage.setItem(AUDIO_KEY,JSON.stringify(audioPrefs));}catch(_){}}
let audioCtx=null,sfxGain=null,musicGain=null,musicTimer=null,musicStep=0,musicNext=0,lastSfxAt=0;
function audioOn(){
 if(audioCtx)return audioCtx;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;audioCtx=new AC();
  sfxGain=audioCtx.createGain();musicGain=audioCtx.createGain();sfxGain.connect(audioCtx.destination);musicGain.connect(audioCtx.destination);applyAudioVolumes();}catch(_){audioCtx=null;}
 return audioCtx;
}
function applyAudioVolumes(){if(!audioCtx)return;const m=audioPrefs.muted?0:1;sfxGain.gain.value=m*audioPrefs.sfx;musicGain.gain.value=m*audioPrefs.music*0.5;
 if(m&&audioPrefs.music>0)startMusic();else stopMusic();}
function tone(freq,start,dur,type,gainNode,peak){
 const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;
 g.gain.setValueAtTime(0.0001,start);g.gain.exponentialRampToValueAtTime(peak,start+0.01);g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
 o.connect(g);g.connect(gainNode);o.start(start);o.stop(start+dur+0.05);
}
const SFX_NOTES={click:[[660,0,0.05]],ok:[[523,0,0.08],[784,0.07,0.1]],warn:[[330,0,0.14],[262,0.12,0.2]],week:[[440,0,0.07],[587,0.06,0.09]],coin:[[988,0,0.06],[1319,0.06,0.18]],win:[[523,0,0.1],[659,0.1,0.1],[784,0.2,0.1],[1047,0.3,0.3]]};
function sfx(name){
 if(audioPrefs.muted||audioPrefs.sfx<=0)return;
 const c=audioOn();if(!c)return;if(c.state==='suspended')c.resume();
 const now=c.currentTime;if(now-lastSfxAt<0.04)return;lastSfxAt=now;
 (SFX_NOTES[name]||[]).forEach(([f,t,d])=>tone(f,now+t,d,name==='warn'?'triangle':'sine',sfxGain,0.5));
}
// Lo-fi loop: four soft chords, one per bar, scheduled a little ahead of time.
const MUSIC_CHORDS=[[220,277.18,329.63,415.3],[196,246.94,293.66,369.99],[174.61,220,261.63,329.63],[196,246.94,293.66,392]];
function startMusic(){if(musicTimer||!audioCtx)return;musicNext=audioCtx.currentTime+0.1;musicStep=0;musicTimer=setInterval(musicTick,500);musicTick();}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}}
function musicTick(){
 if(!audioCtx||document.hidden)return;
 while(musicNext<audioCtx.currentTime+1.2){
  const chord=MUSIC_CHORDS[Math.floor(musicStep/4)%MUSIC_CHORDS.length],beat=0.7;
  tone(chord[musicStep%4],musicNext,beat*1.6,'triangle',musicGain,0.18);
  if(musicStep%4===0)chord.slice(0,3).forEach(f=>tone(f/2,musicNext,beat*4,'sine',musicGain,0.1));
  musicNext+=beat;musicStep++;
 }
}
function soundPanel(){
 const pct=v=>Math.round(v*100);
 return panel('Sound',`<p class="panel-sub" style="margin-bottom:15px">Sounds are made by the game itself. Music starts after your first tap. Your choice stays on this browser.</p>`+
  `<div class="small-stat"><label for="snd-sfx">Effects volume</label><span><input id="snd-sfx" type="range" min="0" max="100" value="${pct(audioPrefs.sfx)}" aria-label="Effects volume"> <strong id="snd-sfx-v">${pct(audioPrefs.sfx)}%</strong></span></div>`+
  `<div class="small-stat"><label for="snd-music">Music volume</label><span><input id="snd-music" type="range" min="0" max="100" value="${pct(audioPrefs.music)}" aria-label="Music volume"> <strong id="snd-music-v">${pct(audioPrefs.music)}%</strong></span></div>`+
  `<div style="margin-top:12px">${btn(audioPrefs.muted?'Sound: Muted':'Sound: On','id="snd-mute"','outline')}</div>`);
}
document.addEventListener('input',e=>{
 const t=e.target;if(!t||(t.id!=='snd-sfx'&&t.id!=='snd-music'))return;
 const key=t.id==='snd-sfx'?'sfx':'music';audioPrefs[key]=clampVol(Number(t.value)/100,0);
 const out=document.getElementById(t.id+'-v');if(out)out.textContent=Math.round(audioPrefs[key]*100)+'%';
 saveAudioPrefs();audioOn();applyAudioVolumes();
});
document.addEventListener('change',e=>{if(e.target&&e.target.id==='snd-sfx')sfx('ok');});
document.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('button');if(!b)return;
 if(b.id==='snd-mute'){audioPrefs.muted=!audioPrefs.muted;saveAudioPrefs();audioOn();applyAudioVolumes();b.textContent=audioPrefs.muted?'Sound: Muted':'Sound: On';if(!audioPrefs.muted)sfx('ok');return;}
 if(audioPrefs.music>0&&!audioPrefs.muted){audioOn();if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();applyAudioVolumes();}
 if(!b.hasAttribute('data-advance')&&!b.hasAttribute('data-advance-decision'))sfx('click');
},true);
