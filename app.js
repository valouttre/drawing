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
 cv.width=w;cv.height=h;ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(t,0,0);hist=[];redoS=[];szr.textContent=w+'×'+h+' px';zv&&zoom(zv);toast('Canvas redimensionné')}
// ---- dessin
const cv=$('#cv'),ctx=cv.getContext('2d',{willReadFrequently:true});
const T=[['pen','✏️','Crayon'],['soft','🖌️','Pinceau doux'],['calli','🖋️','Calligraphie'],['marker','🖍️','Marqueur'],['hl','🟨','Surligneur'],['rain','🌈','Arc-en-ciel'],['spray','💨','Spray'],['eraser','🧽','Gomme'],
 ['line','╱','Ligne'],['arrow','➚','Flèche'],['rect','▭','Rectangle'],['rrect','▢','Arrondi'],['ell','◯','Ellipse'],['tri','△','Triangle'],['dia','◇','Losange'],['star','☆','Étoile'],
 ['fill','🪣','Remplir'],['text','🔤','Texte'],['pick','💧','Pipette']],FREE=['pen','soft','calli','marker','hl','rain','spray','eraser'];
let tool='pen',hist=[],redoS=[],drawing=false,sp,snap,lp,hue=0,k1='#000000',k2='#ffffff',rcl=[],zv=0;
$('#tg').innerHTML=T.map(t=>`<button class="t${t[0]=='pen'?' a':''}" data-t="${t[0]}" title="${t[2]}">${t[1]}<small>${t[2]}</small></button>`).join('');
$$('.t').forEach(b=>b.onclick=()=>{tool=b.dataset.t;$$('.t').forEach(x=>x.classList.toggle('a',x==b))});
// palettes
const hsl=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return'#'+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')};
const PS={'Classique':"#000000,#4d4d4d,#808080,#b3b3b3,#ffffff,#7b3f00,#e03131,#ff922b,#fcc419,#94d82d,#2f9e44,#12b886,#15aabf,#228be6,#4c6ef5,#7048e8,#be4bdb,#f06595,#ffa8a8,#ffd8a8,#ffec99,#b2f2bb,#a5d8ff,#d0bfff".split(','),
 'Teintes (48)':[...Array(48)].map((_,i)=>hsl((i%12)*30,85,[30,45,60,75][i/12|0])),'Pastel':[...Array(24)].map((_,i)=>hsl(i*15,70,85)),'Néon':[...Array(24)].map((_,i)=>hsl(i*15,100,55)),
 'Terre':"#3e2723,#5d4037,#8d6e63,#a1887f,#d7ccc8,#33691e,#558b2f,#827717,#9e9d24,#c0ca33,#bf360c,#e65100,#ef6c00,#f9a825,#ffe0b2,#263238,#455a64,#607d8b,#90a4ae,#cfd8dc".split(','),
 'Peaux':"#ffe0bd,#ffcd94,#f1c27d,#eac086,#e0ac69,#d9a066,#c68642,#a56a3b,#8d5524,#6f4518,#4a2c12,#ffad60".split(','),'Gris':[...Array(16)].map((_,i)=>hsl(0,0,i*100/15))};
const rgb=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16)),sw=c=>`<button class="sw" data-c="${c}" style="background:${c}" title="${c}"></button>`;
pset.innerHTML=Object.keys(PS).map(n=>`<option>${n}</option>`).join('');
function rpal(){$('#pal').innerHTML=PS[pset.value].map(sw).join('')}rpal();
function setC(h,s){if(s){k2=h;col2.value=h}else{k1=h;col.value=h;hex.value=h}}
function swap(){[k1,k2]=[k2,k1];col.value=k1;col2.value=k2;hex.value=k1}
function addRec(c){rcl=[c,...rcl.filter(x=>x!=c)].slice(0,14);$('#rec').innerHTML=rcl.map(sw).join('')}
col.oninput=()=>setC(col.value);col2.oninput=()=>setC(col2.value,1);hex.onchange=()=>{const v=('#'+hex.value.replace('#','')).toLowerCase();/^#[0-9a-f]{6}$/.test(v)?setC(v):hex.value=k1};
['pal','rec'].forEach(i=>{const e=$('#'+i);e.onclick=ev=>{const c=ev.target.dataset.c;c&&setC(c)};e.oncontextmenu=ev=>{ev.preventDefault();const c=ev.target.dataset.c;c&&setC(c,1)}});
// moteur
function beginD(hp){submitted=false;mySel=null;cw.value=800;ch.value=600;cu.value='px';szr.textContent='800×600 px';[cv.width,cv.height]=[800,600];ctx.fillStyle='#fff';ctx.fillRect(0,0,800,600);hist=[];redoS=[];zv=0;zm.value=100;zoom(0);
 $('#rn').textContent=hp.r+'/'+st.r;$('#word').textContent=hp.w;const end=Date.now()+st.t*1000;
 const f=()=>{const t=Math.max(0,Math.round((end-Date.now())/1000));timer.textContent=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');timer.className=t<=10?'lo':'';if(t<=0)submitD()};f();tm=setInterval(f,250);show('draw')}
const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]},pf=e=>e.pointerType=='pen'&&e.pressure?.2+e.pressure*1.6:1;
function save(){hist.push(ctx.getImageData(0,0,cv.width,cv.height));if(hist.length>40)hist.shift();redoS=[]}
function undo(){if(hist.length){redoS.push(ctx.getImageData(0,0,cv.width,cv.height));ctx.putImageData(hist.pop(),0,0)}}
function redo(){if(redoS.length){hist.push(ctx.getImageData(0,0,cv.width,cv.height));ctx.putImageData(redoS.pop(),0,0)}}
function clr(){if(confirm('Tout effacer ?')){save();ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height)}}
function flip(h){save();const t=document.createElement('canvas');t.width=cv.width;t.height=cv.height;t.getContext('2d').drawImage(cv,0,0);ctx.save();ctx.globalAlpha=1;ctx.setTransform(h?-1:1,0,0,h?1:-1,h?cv.width:0,h?0:cv.height);ctx.drawImage(t,0,0);ctx.restore()}
function bg(){save();ctx.globalAlpha=1;ctx.fillStyle=k1;ctx.fillRect(0,0,cv.width,cv.height)}
function png(){const a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='dessin.png';a.click()}
function zoom(v){cv.style.maxWidth=v?'none':'100%';cv.style.width=v?cv.width*v/100+'px':''}
const mir=p=>{const W=cv.width,H=cv.height,m=+sym.value,a=[p];if(m==1||m==3)a.push([W-p[0],p[1]]);if(m==2||m==3)a.push([p[0],H-p[1]]);if(m==3)a.push([W-p[0],H-p[1]]);return a};
function setup(q){const hl=tool=='hl';ctx.globalCompositeOperation=hl?'multiply':'source-over';ctx.globalAlpha=tool=='eraser'?1:hl?.35:opa.value/100;ctx.strokeStyle=ctx.fillStyle=tool=='eraser'?'#fff':k1;ctx.lineWidth=(hl?size.value*2.5:+size.value)*(q||1);ctx.lineCap=tool=='marker'||hl?'square':'round';ctx.lineJoin='round'}
function seg(a,b,q){const s=+size.value*q,d=Math.hypot(b[0]-a[0],b[1]-a[1]);
 if(tool=='soft'){const r=Math.max(1,s),hd=hard.value/100,c=rgb(k1),al=opa.value/100*.35,n=Math.max(1,Math.ceil(d/Math.max(1,r/4)));ctx.globalAlpha=1;
  for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,y=a[1]+(b[1]-a[1])*i/n,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c},${al})`);g.addColorStop(hd,`rgba(${c},${al})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)}return}
 setup(q);
 if(tool=='spray'){for(let i=0;i<14;i++){const t=Math.random()*6.28,r=Math.random()*s*2;ctx.fillRect(b[0]+Math.cos(t)*r,b[1]+Math.sin(t)*r,1.6,1.6)}return}
 if(tool=='calli'){const k=s*.35;ctx.beginPath();ctx.moveTo(a[0]-k,a[1]+k);ctx.lineTo(a[0]+k,a[1]-k);ctx.lineTo(b[0]+k,b[1]-k);ctx.lineTo(b[0]-k,b[1]+k);ctx.closePath();ctx.lineWidth=1;ctx.fill();ctx.stroke();return}
 if(tool=='rain'){hue+=d*.7;ctx.strokeStyle=`hsl(${hue%360},90%,50%)`}
 ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(b[0]+(d?0:.01),b[1]);ctx.stroke()}
function free(p,q){const A=mir(lp),B=mir(p);A.forEach((a,i)=>seg(a,B[i],q));lp=p}
function shp(a,b){const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),w=Math.abs(b[0]-a[0]),h=Math.abs(b[1]-a[1]);ctx.beginPath();
 if(tool=='line'||tool=='arrow'){ctx.moveTo(...a);ctx.lineTo(...b);if(tool=='arrow'){const t=Math.atan2(b[1]-a[1],b[0]-a[0]),L=Math.max(14,+size.value*3);[2.6,-2.6].forEach(o=>{ctx.moveTo(...b);ctx.lineTo(b[0]+L*Math.cos(t+o),b[1]+L*Math.sin(t+o))})}ctx.stroke();return}
 if(tool=='rect')ctx.rect(x,y,w,h);else if(tool=='rrect')ctx.roundRect(x,y,w,h,Math.min(w,h)/4);else if(tool=='ell')ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,7);
 else if(tool=='tri'){ctx.moveTo(x+w/2,y);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.closePath()}
 else if(tool=='dia'){ctx.moveTo(x+w/2,y);ctx.lineTo(x+w,y+h/2);ctx.lineTo(x+w/2,y+h);ctx.lineTo(x,y+h/2);ctx.closePath()}
 else if(tool=='star'){for(let i=0;i<10;i++){const r=i%2?.4:1,t=-Math.PI/2+i*Math.PI/5;ctx[i?'lineTo':'moveTo'](x+w/2+Math.cos(t)*r*w/2,y+h/2+Math.sin(t)*r*h/2)}ctx.closePath()}
 const m=smode.value;if(m!='o'){if(m=='g'){const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,k1);g.addColorStop(1,k2);ctx.fillStyle=g}else ctx.fillStyle=m=='b'?k2:k1;ctx.fill()}
 if(m=='o'||m=='b')ctx.stroke()}
function fill(x,y){const w=cv.width,h=cv.height,id=ctx.getImageData(0,0,w,h),d=id.data;x|=0;y|=0;const i0=(y*w+x)*4,t=[d[i0],d[i0+1],d[i0+2]],c=rgb(k1),a=opa.value/100,th=tol.value*3;
 const m=i=>Math.abs(d[i]-t[0])+Math.abs(d[i+1]-t[1])+Math.abs(d[i+2]-t[2])<=th,seen=new Uint8Array(w*h),s=[x,y];
 while(s.length){const yy=s.pop(),xx=s.pop(),p=yy*w+xx;if(seen[p]||!m(p*4))continue;seen[p]=1;const i=p*4;for(let k=0;k<3;k++)d[i+k]=d[i+k]*(1-a)+c[k]*a;
  if(xx>0)s.push(xx-1,yy);if(xx<w-1)s.push(xx+1,yy);if(yy>0)s.push(xx,yy-1);if(yy<h-1)s.push(xx,yy+1)}ctx.putImageData(id,0,0)}
cv.onpointerdown=e=>{if(e.button==2)return;e.preventDefault();cv.setPointerCapture(e.pointerId);const p=pos(e);
 if(tool=='pick'){const d=ctx.getImageData(p[0]|0,p[1]|0,1,1).data;setC('#'+[d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join(''),e.shiftKey);return}
 save();if(tool!='eraser')addRec(k1);
 if(tool=='fill'){fill(...p);return}
 if(tool=='text'){const t=prompt('Texte à écrire :');if(t){setup();ctx.font=`bold ${size.value*4}px sans-serif`;ctx.textBaseline='middle';ctx.fillText(t.slice(0,60),...p)}return}
 drawing=true;sp=p;lp=p;snap=ctx.getImageData(0,0,cv.width,cv.height);if(FREE.includes(tool))free(p,pf(e))};
cv.onpointermove=e=>{if(!drawing)return;let p=pos(e);
 if(FREE.includes(tool)){if(sm.checked)p=[lp[0]+(p[0]-lp[0])*.3,lp[1]+(p[1]-lp[1])*.3];free(p,pf(e))}
 else{ctx.putImageData(snap,0,0);setup();const A=mir(sp),B=mir(p);A.forEach((a,i)=>shp(a,B[i]))}};
cv.onpointerup=cv.onpointercancel=()=>{drawing=false;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'};
cv.oncontextmenu=e=>e.preventDefault();
addEventListener('keydown',e=>{const t=e.target;if(!$('#draw').classList.contains('on')||t.tagName=='INPUT'&&['text','number'].includes(t.type))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='z'){e.preventDefault();e.shiftKey?redo():undo()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='y'){e.preventDefault();redo()}
 else if(e.key=='['){size.value=Math.max(1,size.value-3);szv.textContent=size.value}else if(e.key==']'){size.value=Math.min(120,+size.value+3);szv.textContent=size.value}});
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
