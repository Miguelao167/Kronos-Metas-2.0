import { env } from 'cloudflare:workers';

const tables = [
  `CREATE TABLE IF NOT EXISTS calls (id INTEGER PRIMARY KEY, company TEXT NOT NULL, niche TEXT NOT NULL, result TEXT NOT NULL, date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY, company TEXT NOT NULL, type TEXT NOT NULL, value REAL NOT NULL DEFAULT 0, received REAL NOT NULL DEFAULT 0, date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, company TEXT NOT NULL, niche TEXT NOT NULL, status TEXT NOT NULL, potential REAL NOT NULL DEFAULT 0, next TEXT NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS campaigns (id INTEGER PRIMARY KEY, title TEXT NOT NULL, start_date TEXT NOT NULL, total_days INTEGER NOT NULL, target REAL NOT NULL, active INTEGER NOT NULL DEFAULT 1)`,
  `CREATE INDEX IF NOT EXISTS idx_calls_niche ON calls(niche)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
];

async function ready(){if(!env.DB)throw new Error('DB_UNAVAILABLE');await env.DB.batch(tables.map(sql=>env.DB.prepare(sql)))}

export async function GET(){try{await ready();const [calls,sales,leads,campaignResult]=await env.DB.batch([env.DB.prepare('SELECT * FROM calls ORDER BY id DESC'),env.DB.prepare('SELECT * FROM sales ORDER BY id DESC'),env.DB.prepare('SELECT * FROM leads ORDER BY id DESC'),env.DB.prepare('SELECT id,title,start_date AS startDate,total_days AS totalDays,target FROM campaigns WHERE active = 1 ORDER BY id DESC LIMIT 1')]);return Response.json({calls:calls.results,sales:sales.results,leads:leads.results,campaign:campaignResult.results[0]||null})}catch{return Response.json({error:'Banco ainda não conectado'},{status:503})}}

export async function POST(request:Request){try{await ready();const {kind,item}=await request.json() as {kind:string,item:Record<string,string|number>};if(kind==='call')await env.DB.prepare('INSERT INTO calls (id,company,niche,result,date) VALUES (?,?,?,?,?)').bind(item.id,item.company,item.niche,item.result,item.date).run();else if(kind==='sale')await env.DB.prepare('INSERT INTO sales (id,company,type,value,received,date) VALUES (?,?,?,?,?,?)').bind(item.id,item.company,item.type,item.value,item.received,item.date).run();else if(kind==='lead')await env.DB.prepare('INSERT INTO leads (id,company,niche,status,potential,next) VALUES (?,?,?,?,?,?)').bind(item.id,item.company,item.niche,item.status,item.potential,item.next).run();else if(kind==='campaign'){await env.DB.batch([env.DB.prepare('UPDATE campaigns SET active = 0 WHERE active = 1'),env.DB.prepare('INSERT INTO campaigns (id,title,start_date,total_days,target,active) VALUES (?,?,?,?,?,1)').bind(item.id,item.title,item.startDate,item.totalDays,item.target)])}else return Response.json({error:'Tipo inválido'},{status:400});return Response.json({ok:true})}catch{return Response.json({error:'Não foi possível salvar'},{status:503})}}

export async function DELETE(request:Request){try{await ready();const url=new URL(request.url);const kind=url.searchParams.get('kind');const id=Number(url.searchParams.get('id'));if(kind!=='call'||!Number.isSafeInteger(id))return Response.json({error:'Parâmetros inválidos'},{status:400});const result=await env.DB.prepare('DELETE FROM calls WHERE id = ?').bind(id).run();if(!result.meta.changes)return Response.json({error:'Registro não encontrado'},{status:404});return Response.json({ok:true})}catch{return Response.json({error:'Não foi possível remover'},{status:503})}}

