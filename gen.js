// Gera prices.json a partir de exportação do banco (meses/*.json, cotacoes/*.json, regras.json)
const fs=require("fs"),path=require("path");
const dir=process.argv[2]||"/tmp/gen/db2";
const regras=Object.assign({markup:100,fixo:50,limite:100,precoFixo:250,preferido:"agape"},JSON.parse(fs.readFileSync(path.join(dir,"regras.json"))));
function lerDir(d){try{return fs.readdirSync(d).filter(f=>f.endsWith(".json")).map(f=>{const j=JSON.parse(fs.readFileSync(path.join(d,f)));return j.data||j})}catch(e){return []}}
const meses=lerDir(path.join(dir,"meses")).sort((a,b)=>a.id<b.id?-1:1),cots=lerDir(path.join(dir,"cotacoes"));
const norm=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\s+/g," ").trim();
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=[],c=[];for(let j=0;j<=n;j++)p[j]=j;for(let i=1;i<=m;i++){c[0]=i;for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a.charCodeAt(i-1)===b.charCodeAt(j-1)?0:1));p=c.slice()}return p[n]}
const preco=c=>c<regras.limite?{v:regras.precoFixo,min:true}:{v:Math.round((c*(1+regras.markup/100)+regras.fixo)*100)/100,min:false};
const pref=f=>{const p=norm(regras.preferido);return p&&norm(f).includes(p)};
const best=l=>l.reduce((b,x)=>!b||x.o>b.o?x:b,null);
const todas=[];
meses.forEach(m=>(m.linhas||[]).forEach((l,i)=>todas.push({k:l.k,m:l.m,kq:l.kq,q:l.q,c:l.c,d:l.d,f:l.f,cot:false,o:l.d+"|"+m.id+"|"+String(i).padStart(5,"0")})));
cots.forEach(c=>todas.push({k:c.k,m:c.m,kq:c.kq,q:c.q,c:c.c,d:c.d,f:c.f,cot:true,o:c.d+"|~|"+c.id}));
const cont={},rot={};todas.forEach(r=>{cont[r.kq]=(cont[r.kq]||0)+1;if(!rot[r.kq])rot[r.kq]=r.q});
const mapa={};Object.keys(cont).forEach(kq=>{let alvo=kq;
  if(kq!=="premium/incell"&&(lev(kq,"premium")<=2||lev(kq,"incell")<=1))alvo="premium/incell";
  else if(kq.length>=5){let mk=null;Object.keys(cont).forEach(o=>{if(o!==kq&&cont[o]>cont[kq]&&lev(kq,o)<=1&&(!mk||cont[o]>cont[mk]))mk=o});if(mk)alvo=mk}
  mapa[kq]=alvo;if(alvo==="premium/incell")rot[alvo]="Premium/Incell"});
todas.forEach(r=>{r.m=String(r.m).replace(/\s+/g," ").trim()});
const idx={};
todas.forEach(r=>{const kq=mapa[r.kq]||r.kq,mod=idx[r.k]||(idx[r.k]={k:r.k,m:r.m,q:{}});mod.m=r.m;(mod.q[kq]||(mod.q[kq]={q:rot[kq]||r.q,rows:[]})).rows.push(r)});
const modelos=Object.values(idx).map(mod=>({k:mod.k,m:mod.m,q:Object.values(mod.q).map(q=>{
  const a=best(q.rows.filter(r=>pref(r.f))),o=best(q.rows.filter(r=>!pref(r.f))),u=a||o,p=preco(u.c);
  return {q:q.q,p:p.v,min:p.min,d:u.d,cot:!!u.cot};
}).sort((x,y)=>y.p-x.p)})).sort((a,b)=>a.k<b.k?-1:1);
const out={gerado:new Date().toISOString().slice(0,10),ate:meses.length?String(meses[meses.length-1].rotulo).replace(/([A-Za-zÀ-ÿ])(\d{4})$/,"$1/$2"):"",modelos};
fs.writeFileSync(path.join(__dirname,"prices.json"),JSON.stringify(out));
console.log(modelos.length+" modelos, "+modelos.reduce((a,m)=>a+m.q.length,0)+" preços, "+JSON.stringify(regras));
