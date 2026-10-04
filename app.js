// Dessine & Vote — jeu de dessin multijoueur (sans serveur : PeerJS / WebRTC)
let ia=0,ic=5,peer,conns={},hconn,isHost=false,myId='',gc='',st={t:90,r:3,th:''},S={},G={},cur='',R=0,submitted=false,mySel=null,tm,items=[];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AV="🐱🐶🦊🐼🐸🦄🐙🦁🐵🐧🐢🦉🐷🐰🐻🦖👽🤖👻🎃🍕🌵🚀🎸".match(/\p{Extended_Pictographic}/gu),CL="#ff6b6b,#ff922b,#fcc419,#51cf66,#20c997,#339af0,#5c7cfa,#cc5de8,#f783ac,#adb5bd".split(",");
const WORDS="un chat pirate,une pizza volante,un robot amoureux,la tour Eiffel,un dragon timide,un monstre sous le lit,un astronaute en vacances,une baguette géante,un fantôme au bureau,une licorne punk,un escargot rapide,un super-héros fatigué,un château de sable,un requin en costume,un vampire végétarien,une voiture en fromage,un pingouin au soleil,un cactus qui danse,une sirène moderne,un zombie cuisinier,un hamster géant,un volcan en colère,une vache sur la lune,un sorcier maladroit,un chien détective,un dinosaure à vélo,un alien à Bordeaux,une maison hantée".split(",");
const COLS="#000000,#ffffff,#7f7f7f,#c3c3c3,#e03131,#ff922b,#fcc419,#51cf66,#12b886,#228be6,#4c6ef5,#9c36b5,#f06595,#8d5524,#ffd8a8,#0b7285".split(",");
const U={px:1,po:96,cm:96/2.54,mm:96/25.4};
function show(id){$$('.s').forEach(e=>e.classList.toggle('on',e.id==id));scrollTo(0,0)}
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',3000)}
$('#avs').innerHTML=AV.map((a,i)=>`<button data-i="${i}" class="${i==0?'sel':''}" onclick="ia=${i};sel('#avs',this)">${a}</button>`).join('');
$('#cls').innerHTML=CL.map((c,i)=>`<button data-i="${i}" class="${i==5?'sel':''}" style="background:${c};width:34px;height:34px" onclick="ic=${i};sel('#cls',this)"></button>`).join('');
function sel(s,b){$$(s+' button').forEach(x=>x.classList.toggle('sel',x==b))}
const av=p=>`<span class="av" style="background:${/^#[0-9a-f]{6}$/i.test(p.c)?p.c:'#888'}">${AV.includes(p.a)?p.a:'🙂'}</span>`;
function dims(){const u=U[cu.value];return[Math.max(100,Math.min(2000,Math.round(cw.value*u)||800)),Math.max(100,Math.min(2000,Math.round(ch.value*u)||600))]}
function applyC(){const[w,h]=dims();if(w==cv.width&&h==cv.height){szr.textContent=w+'×'+h+' px';return}
 const t=document.createElement('canvas');t.width=cv.width;t.height=cv.height;t.getContext('2d').drawImage(cv,0,0);
 cv.width=w;cv.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(t,0,0);hist=[];redoS=[];szr.textContent=w+'×'+h+' px';toast('Canvas redimensionné')}
// ---- dessin
const cv=$('#cv'),ctx=cv.getContext('2d',{willReadFrequently:true});let tool='pen',hist=[],redoS=[],drawing=false,sp,snap;
$$('.t').forEach(b=>b.onclick=()=>{tool=b.dataset.t;$$('.t').forEach(x=>x.classList.toggle('a',x==b))});
$('#pal').innerHTML=COLS.map(c=>`<button class="sw" style="background:${c}" onclick="col.value='${c}'"></button>`).join('');
function beginD(hp){submitted=false;mySel=null;cw.value=800;ch.value=600;cu.value='px';szr.textContent='800×600 px';[cv.width,cv.height]=[800,600];ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);hist=[];redoS=[];
 $('#rn').textContent=hp.r+'/'+st.r;$('#word').textContent=hp.w;const end=Date.now()+st.t*1000;
 const f=()=>{const t=Math.max(0,Math.round((end-Date.now())/1000));timer.textContent=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');timer.className=t<=10?'lo':'';if(t<=0)submitD()};f();tm=setInterval(f,250);show('draw')}
function pos(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]}
function save(){hist.push(ctx.getImageData(0,0,cv.width,cv.height));if(hist.length>30)hist.shift();redoS=[]}
function undo(){if(hist.length){redoS.push(ctx.getImageData(0,0,cv.width,cv.height));ctx.putImageData(hist.pop(),0,0)}}
function redo(){if(redoS.length){hist.push(ctx.getImageData(0,0,cv.width,cv.height));ctx.putImageData(redoS.pop(),0,0)}}
function clr(){if(confirm('Tout effacer ?')){save();ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height)}}
function setup(){const er=tool=='eraser';ctx.globalAlpha=er?1:opa.value/100;ctx.strokeStyle=ctx.fillStyle=er?'#fff':col.value;ctx.lineWidth=+size.value;ctx.lineCap=ctx.lineJoin='round'}
function shape(a,b){setup();ctx.beginPath();if(tool=='line'){ctx.moveTo(...a);ctx.lineTo(...b)}else if(tool=='rect')ctx.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]);else ctx.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2,Math.abs(b[1]-a[1])/2,0,0,7);solid.checked&&tool!='line'?ctx.fill():ctx.stroke()}
function spray(p){setup();const r=+size.value*2;for(let i=0;i<14;i++){const a=Math.random()*6.28,d=Math.random()*r;ctx.fillRect(p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d,1.6,1.6)}}
function fill(x,y){const w=cv.width,h=cv.height,id=ctx.getImageData(0,0,w,h),d=id.data;x|=0;y|=0;const i0=(y*w+x)*4,t=[d[i0],d[i0+1],d[i0+2]],c=[1,3,5].map(i=>parseInt(col.value.substr(i,2),16)),a=opa.value/100;
 const m=i=>Math.abs(d[i]-t[0])+Math.abs(d[i+1]-t[1])+Math.abs(d[i+2]-t[2])<70,seen=new Uint8Array(w*h),s=[x,y];
 while(s.length){const yy=s.pop(),xx=s.pop(),p=yy*w+xx;if(seen[p]||!m(p*4))continue;seen[p]=1;const i=p*4;for(let k=0;k<3;k++)d[i+k]=d[i+k]*(1-a)+c[k]*a;
  if(xx>0)s.push(xx-1,yy);if(xx<w-1)s.push(xx+1,yy);if(yy>0)s.push(xx,yy-1);if(yy<h-1)s.push(xx,yy+1)}ctx.putImageData(id,0,0)}
cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const p=pos(e);
 if(tool=='pick'){const d=ctx.getImageData(p[0]|0,p[1]|0,1,1).data;col.value='#'+[...d].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');return}
 save();if(tool=='fill'){fill(...p);return}
 drawing=true;sp=p;snap=ctx.getImageData(0,0,cv.width,cv.height);
 if(tool=='pen'||tool=='eraser'){setup();ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(p[0]+.01,p[1]);ctx.stroke()}else if(tool=='spray')spray(p)};
cv.onpointermove=e=>{if(!drawing)return;const p=pos(e);
 if(tool=='pen'||tool=='eraser'){setup();ctx.lineTo(...p);ctx.stroke();ctx.beginPath();ctx.moveTo(...p)}
 else if(tool=='spray')spray(p);else{ctx.putImageData(snap,0,0);shape(sp,p)}};
cv.onpointerup=cv.onpointercancel=()=>{drawing=false;ctx.globalAlpha=1};
function enc(){const k0=Math.min(1,480/Math.max(cv.width,cv.height));let s=1,q=.6,out;
 for(let k=0;k<6;k++){const w=Math.max(60,cv.width*k0*s|0),h=Math.max(60,cv.height*k0*s|0),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(cv,0,0,w,h);
  out=c.toDataURL('image/jpeg',q).split(',')[1];if(out.length<36000)break;s*=.8;q=Math.max(.35,q-.05)}return out}

// ===== Réseau : PeerJS (WebRTC), topologie en étoile — l'hôte fait office de serveur
const PRE='dvote-',ok=s=>typeof s=='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(s),rnd=()=>Math.random().toString(36).slice(2,7);
const err=m=>{herr.textContent=m||''};
function profile(){const n=$('#nick').value.trim().slice(0,14);if(!n){err('Choisis un pseudo !');return null}err();return{n,a:AV[ia],c:CL[ic]}}
function copyC(){try{navigator.clipboard.writeText(gc.toUpperCase());toast('Code copié')}catch(e){toast('Code : '+gc.toUpperCase())}}
function copyL(){const u=location.origin+location.pathname+'?c='+gc;try{navigator.clipboard.writeText(u);toast('Lien copié')}catch(e){toast(u)}}
function send(id,m){if(id=='host')setTimeout(()=>onMsg(m),0);else if(conns[id]&&conns[id].open)conns[id].send(m)}
const tx=m=>isHost?hrecv('host',m):hconn&&hconn.send(m);
// --- hôte
function create(){const pr=profile();if(!pr)return;if(!window.Peer)return err('PeerJS non chargé (connexion internet ?)');
 gc=rnd();isHost=true;myId='host';err('Création de la partie…');peer=new Peer(PRE+gc);
 peer.on('error',e=>{if(e.type=='unavailable-id'){peer.destroy();create()}else err('Erreur réseau : '+e.type)});
 peer.on('open',()=>{G={ph:'lobby',r:0,pl:[{id:'host',...pr}],dr:{},vt:{},sc:{},order:[],res:null};push()});
 peer.on('connection',c=>{c.on('open',()=>{conns[c.peer]=c});c.on('data',m=>hrecv(c.peer,m));c.on('close',()=>drop(c.peer))})}
const view=()=>({t:'s',ph:G.ph,r:G.r,w:G.w,st,sc:G.sc,res:G.res,pl:G.pl.map(p=>({...p,sub:!!G.dr[p.id],v:G.vt[p.id]!=null}))});
function push(){const v=view();G.pl.forEach(p=>send(p.id,v))}
function hrecv(id,m){if(!m||typeof m!='object')return;
 if(m.t=='join'){if(G.ph!='lobby'||G.pl.length>=12||G.pl.some(p=>p.id==id)){send(id,{t:'err',m:G.ph!='lobby'?'Partie déjà commencée.':'Partie pleine.'});return}
  G.pl.push({id,n:String(m.n).slice(0,14),a:AV.includes(m.a)?m.a:'🙂',c:/^#[0-9a-f]{6}$/i.test(m.c)?m.c:'#888888'});push();return}
 if(!G.pl.some(p=>p.id==id))return;
 if(m.t=='draw'&&G.ph=='draw'&&m.r==G.r&&typeof m.d=='string'&&m.d.length<300000&&/^[A-Za-z0-9+\/=]+$/.test(m.d)){G.dr[id]=m.d;push();if(G.pl.every(p=>G.dr[p.id]))toVote()}
 else if(m.t=='vote'&&G.ph=='vote'){const o=G.order[m.k];if(o&&o.id!=id){G.vt[id]=m.k;push();chkVotes()}}}
function drop(id){delete conns[id];G.pl=G.pl.filter(p=>p.id!=id);delete G.dr[id];delete G.vt[id];push();
 if(G.ph=='draw'&&G.pl.length&&G.pl.every(p=>G.dr[p.id]))toVote();else chkVotes()}
function startRound(r){clearTimeout(G.tt);G.ph='draw';G.r=r;G.w=st.th||WORDS[Math.random()*WORDS.length|0];G.dr={};G.vt={};G.order=[];G.res=null;
 G.tt=setTimeout(()=>{if(G.ph=='draw'&&G.r==r)toVote()},(st.t+12)*1000);push()}
function toVote(){clearTimeout(G.tt);G.order=Object.entries(G.dr).map(([id,d])=>({id,d})).sort(()=>Math.random()-.5);G.ph='vote';G.vt={};
 G.pl.forEach(p=>send(p.id,{t:'items',items:G.order.map((o,k)=>o.id==p.id?null:{k,img:'data:image/jpeg;base64,'+o.d}).filter(Boolean)}));push();chkVotes()}
function chkVotes(){if(G.ph=='vote'&&G.pl.every(p=>G.vt[p.id]!=null||!G.order.some(o=>o.id!=p.id)))toRes()}
function toRes(){const cnt={},live=o=>G.pl.some(p=>p.id==o.id);Object.values(G.vt).forEach(k=>{const o=G.order[k];if(o&&live(o))cnt[o.id]=(cnt[o.id]||0)+1});
 Object.keys(cnt).forEach(id=>G.sc[id]=(G.sc[id]||0)+cnt[id]);
 G.res=G.order.filter(live).map(o=>({id:o.id,img:'data:image/jpeg;base64,'+o.d,v:cnt[o.id]||0})).sort((a,b)=>b.v-a.v);G.ph='res';push()}
function startG(){if(isHost&&G.pl.length>1){G.sc={};startRound(1)}}
function nextR(){if(!isHost)return;if(G.r<st.r)startRound(G.r+1);else{G.ph='fin';push()}}
function replay(){if(!isHost)return;G.ph='lobby';G.r=0;G.sc={};G.dr={};G.vt={};G.res=null;push()}
function upd(){if(!isHost)return;st={t:+time.value,r:Math.max(1,Math.min(10,+rounds.value||1)),th:custom.value.trim().slice(0,40)};push()}
// --- joueur
function joinG(){const pr=profile();if(!pr)return;const c=$('#jc').value.trim().toLowerCase();if(!/^[a-z0-9]{4,8}$/.test(c))return err('Code invalide');
 if(!window.Peer)return err('PeerJS non chargé (connexion internet ?)');gc=c;err('Connexion…');peer=new Peer();
 const to=setTimeout(()=>err('Partie introuvable.'),12000);
 peer.on('error',e=>{clearTimeout(to);err(e.type=='peer-unavailable'?'Partie introuvable.':'Erreur réseau : '+e.type)});
 peer.on('open',id=>{myId=id;hconn=peer.connect(PRE+c,{reliable:true});
  hconn.on('open',()=>{clearTimeout(to);hconn.send({t:'join',...pr})});hconn.on('data',onMsg);
  hconn.on('close',()=>{if(cur!='gone'){cur='gone';toast("Connexion perdue avec l'hôte");setTimeout(()=>location.reload(),2500)}})})}
function onMsg(m){if(!m||typeof m!='object')return;if(m.t=='err'){err(m.m);return}
 if(m.t=='items'){items=(m.items||[]).filter(i=>ok(i.img));return}if(m.t!='s')return;
 S=m;st=m.st||st;const k=m.ph+'|'+m.r;if(k!=cur){cur=k;R=m.r;enter(m)}else refresh(m)}
function enter(m){clearInterval(tm);
 if(m.ph=='lobby'){show('lobby');rLobby()}else if(m.ph=='draw')beginD(m);else if(m.ph=='vote')rVote();else if(m.ph=='res')rRes();else if(m.ph=='fin')rFin()}
function refresh(m){if(m.ph=='lobby')rLobby();else if(m.ph=='draw'&&submitted)rWait();else if(m.ph=='vote')vstat()}
function rLobby(){$('#code').textContent=gc.toUpperCase();
 $('#lp').innerHTML=S.pl.map(p=>`<span class="pc">${av(p)}<b>${esc(p.n)}</b>${p.id=='host'?' 👑':''}${p.id==myId?' <span class="mu">(toi)</span>':''}</span>`).join('');
 hs.style.display=isHost?'':'none';gs.style.display=isHost?'none':'';go.style.display=isHost?'':'none';go.disabled=S.pl.length<2;
 gw.textContent=isHost?(S.pl.length<2?'Il faut au moins 2 joueurs.':''):"L'hôte va lancer la partie…";
 gs.innerHTML=`<b>Réglages :</b> ⏱ ${st.t}s · ${st.r} manche(s) · ${esc(st.th)||'thème aléatoire'}`}
function pre(w,h,u){cw.value=w;ch.value=h;cu.value=u;applyC()}
function submitD(){if(submitted||cur.split('|')[0]!='draw')return;submitted=true;clearInterval(tm);tx({t:'draw',r:R,d:enc()});show('wait');rWait()}
function rWait(){wl.innerHTML=S.pl.map(p=>`<span class="pc">${av(p)}${esc(p.n)} ${p.sub?'✅':'✏️'}</span>`).join('')}
const voted=()=>{const p=S.pl.find(q=>q.id==myId);return p&&p.v};
function rVote(){mySel=null;vok.disabled=true;vok.style.display='';vword.textContent=S.w;show('vote');
 vg.innerHTML=items.map((it,i)=>`<div class="d" data-k="${+it.k}"><img src="${it.img}"><div class="mu">Dessin ${i+1}</div></div>`).join('')||'<p class="c mu">Aucun dessin à voter.</p>';
 $$('#vg .d').forEach(el=>el.onclick=()=>{if(voted())return;mySel=+el.dataset.k;$$('#vg .d').forEach(x=>x.classList.toggle('sel',x==el));vok.disabled=false});vstat()}
function castVote(){if(mySel==null||voted())return;tx({t:'vote',k:mySel});vok.style.display='none'}
function vstat(){vs.textContent=(voted()?'Vote enregistré ✔ — ':'')+S.pl.filter(p=>p.v).length+'/'+S.pl.length+' ont voté'}
function board(el){const a=S.pl.map(p=>({p,s:S.sc[p.id]||0})).sort((x,y)=>y.s-x.s);
 el.innerHTML=a.map((o,i)=>`<div class="row" style="justify-content:space-between;padding:4px 0"><span>${['🥇','🥈','🥉'][i]||(i+1)+'.'} ${av(o.p)}<b>${esc(o.p.n)}</b></span><span>${o.s} pt${o.s>1?'s':''}</span></div>`).join('');return a}
function rRes(){const res=S.res||[],mx=Math.max(0,...res.map(o=>o.v));rt.textContent=`Manche ${S.r}/${st.r} — « ${S.w} »`;
 rg.innerHTML=res.map(o=>{const p=S.pl.find(q=>q.id==o.id);if(!p||!ok(o.img))return'';return`<div class="d ${o.v==mx&&mx>0?'w':''}" style="cursor:default"><img src="${o.img}"><div>${av(p)}<b>${esc(p.n)}</b><br>${o.v} vote${o.v>1?'s':''} ${o.v==mx&&mx>0?'👑':''}</div></div>`}).join('');
 board($('#lb'));nx.textContent=S.r<st.r?'Manche suivante ▶':'Résultat final 🏆';nx.style.display=isHost?'':'none';nw.textContent=isHost?'':"En attente de l'hôte…";show('res')}
function rFin(){const a=board($('#flb'));
 pod.innerHTML=[1,0,2].filter(i=>a[i]).map(i=>`<div style="height:${160-i*40}px">${['🥇','🥈','🥉'][i]}<br>${av(a[i].p)}<br><b>${esc(a[i].p.n)}</b><br>${a[i].s} pts</div>`).join('');
 rp.style.display=isHost?'':'none';rw.textContent=isHost?'':"L'hôte peut relancer une partie.";show('fin')}
{const q=new URLSearchParams(location.search).get('c');if(q)$('#jc').value=q.slice(0,8)}
