// Uso: node gen.js <pasta-do-banco>  -> escreve dados.json (compras, cotações e regras)
const fs=require("fs"),path=require("path");
const dir=process.argv[2];if(!dir){console.error("uso: node gen.js <pasta-do-banco>");process.exit(1)}
function lerDir(d){try{return fs.readdirSync(d).filter(f=>f.endsWith(".json")).map(f=>{const j=JSON.parse(fs.readFileSync(path.join(d,f)));return j.data||j})}catch(e){return []}}
const regras=Object.assign({markup:100,fixo:50,limite:100,precoFixo:250,preferido:"agape"},JSON.parse(fs.readFileSync(path.join(dir,"regras.json"))));
const meses={},cots={};
lerDir(path.join(dir,"meses")).forEach(m=>{meses[m.id]={id:m.id,rotulo:m.rotulo,ano:m.ano,mes:m.mes,linhas:(m.linhas||[]).map(l=>({d:l.d,p:l.p,m:String(l.m).replace(/\s+/g," ").trim(),k:l.k,q:l.q,kq:l.kq,c:l.c,f:l.f,dv:l.dv}))}});
lerDir(path.join(dir,"cotacoes")).forEach(c=>{cots[c.id]=c});
fs.writeFileSync(path.join(__dirname,"dados.json"),JSON.stringify({gerado:new Date().toISOString().slice(0,10),regras,meses,cots}));
console.log(Object.keys(meses).length+" meses, "+Object.keys(cots).length+" cotações");
