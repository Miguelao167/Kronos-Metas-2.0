"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Layers3,
  Menu,
  Phone,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
const initialNiches = [
  ["Clínicas e dentistas", 10],
  ["Advogados e contadores", 10],
  ["Construção e engenharia", 10],
  ["Imobiliárias", 8],
  ["Energia solar", 7],
  ["Transportes e logística", 7],
  ["Automotivo", 7],
  ["Beleza e estética", 7],
  ["Restaurantes", 5],
  ["Academias", 4],
  ["Outros negócios", 5],
] as const;
const nicheOffer: Record<string, { category: string; price: number }> = {
  "Clínicas e dentistas": { category: "Site Premium", price: 6000 },
  "Advogados e contadores": { category: "Site Profissional", price: 3000 },
  "Construção e engenharia": { category: "Site Premium", price: 6000 },
  Imobiliárias: { category: "Site Premium", price: 6000 },
  "Energia solar": { category: "Projeto High Ticket", price: 10000 },
  "Transportes e logística": { category: "Site Profissional", price: 3000 },
  Automotivo: { category: "Site Profissional", price: 3000 },
  "Beleza e estética": { category: "Site Express", price: 1000 },
  Restaurantes: { category: "Site Express", price: 1000 },
  Academias: { category: "Site Profissional", price: 3000 },
  "Outros negócios": { category: "Site Express", price: 1000 },
};
type Call = {
  id: number;
  company: string;
  niche: string;
  result: string;
  date: string;
};
type Sale = {
  id: number;
  company: string;
  type: string;
  value: number;
  received: number;
  date: string;
};
type Lead = {
  id: number;
  company: string;
  niche: string;
  status: string;
  potential: number;
  next: string;
};
type Campaign = {
  id: number;
  title: string;
  startDate: string;
  totalDays: number;
  target: number;
  active?: number | boolean;
};
const money = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const apiFetch=(url:string,init:RequestInit={})=>{let id=localStorage.getItem("kronos-device-id");if(!id){id=crypto.randomUUID();localStorage.setItem("kronos-device-id",id)}return fetch(url,{...init,headers:{...(init.headers||{}),"x-device-id":id}})};
const buildAIPlan = (target: number, days: number) => {
  const safeTarget = Math.max(1, target),
    safeDays = Math.max(1, days),
    ticket = 3000,
    conversion = 0.012,
    clients = Math.ceil(safeTarget / ticket),
    prospects = Math.ceil(clients / conversion),
    callsPerDay = Math.ceil(prospects / safeDays);
  const scale = safeTarget / 100000;
  return {
    daily: safeTarget / safeDays,
    clients,
    prospects,
    callsPerDay,
    weeks: [0.15, 0.35, 0.65, 1].map((share, i) => ({
      label: `Semana ${i + 1}`,
      value: safeTarget * share,
    })),
    mix: [
      ["Site Express", 1000, Math.max(1, Math.round(20 * scale))],
      ["Site Profissional", 3000, Math.max(1, Math.round(10 * scale))],
      ["Site Premium", 6000, Math.max(1, Math.round(5 * scale))],
      ["Projeto High Ticket", 10000, Math.max(1, Math.round(2 * scale))],
    ] as [string, number, number][],
  };
};
export default function Home() {
  const [view, setView] = useState("Visão geral");
  const [modal, setModal] = useState<"call" | "sale" | "lead" | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    apiFetch("/api/data")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setCalls(d.calls || []);
        setSales(d.sales || []);
        setLeads(d.leads || []);
        setCampaign(d.campaign || null);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  const save = async (
    kind: "call" | "sale" | "lead",
    item: Call | Sale | Lead,
  ) => {
    const r = await apiFetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, item }),
    });
    if (!r.ok) throw new Error("Não foi possível salvar");
  };
  const removeCall = async (id: number) => {
    if (
      !window.confirm("Remover esta ligação? Esta ação não pode ser desfeita.")
    )
      return;
    const r = await apiFetch(`/api/data?kind=call&id=${id}`, { method: "DELETE" });
    if (!r.ok) {
      window.alert("Não foi possível remover a ligação.");
      return;
    }
    setCalls((v) => v.filter((c) => c.id !== id));
  };
  const elapsed = campaign
    ? Math.max(
        1,
        Math.min(
          campaign.totalDays,
          Math.floor(
            (Date.now() -
              new Date(`${campaign.startDate}T00:00:00`).getTime()) /
              86400000,
          ) + 1,
        ),
      )
    : 1;
  const days = campaign ? Math.max(0, campaign.totalDays - elapsed + 1) : 30;
  const target = campaign?.target || 100000;
  const revenue = sales
      .filter((s) => s.value > 0)
      .reduce((a, s) => a + s.value, 0),
    sold = sales.length,
    remaining = Math.max(0, target - revenue),
    daily = days ? remaining / days : remaining,
    avg = sold ? revenue / sold : 0;
  const nicheDone = (n: string) => calls.filter((c) => c.niche === n).length;
  const todayCalls = calls.length;
  const closeRate = calls.length ? (sales.length / calls.length) * 100 : 0;
  const nav = (label: string, icon: React.ReactNode, badge?: number) => (
    <button
      onClick={() => {setView(label);setMobileMenu(false)}}
      className={view === label ? "active" : ""}
    >
      {icon}
      {label}
      {badge ? <b>{badge}</b> : null}
    </button>
  );
  const createCampaign = async (next: Campaign) => {
    const r = await apiFetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "campaign", item: next }),
    });
    if (!r.ok) throw new Error("Não foi possível criar a contagem");
    setCampaign(next);
    setEntered(true);
    setView("Visão geral");
  };
  if (!loaded)
    return (
      <main className="countdown-screen">
        <div className="countdown-loading">Preparando sua operação...</div>
      </main>
    );
  if (!campaign) return <CountdownSetup create={createCampaign} />;
  if (!entered) return <main className="campaign-entry"><div className="entry-shell"><div className="entry-brand"><span className="brand-mark">K</span><span>KRONOS<small>ESCOLHA SUA CONTAGEM</small></span></div><CampaignManager current={campaign} landing onEnter={()=>setEntered(true)}/></div></main>;
  return (
    <main className="app-shell">
      {mobileMenu?<button className="mobile-menu-backdrop" aria-label="Fechar menu" onClick={()=>setMobileMenu(false)}/>:null}
      <aside className={`sidebar ${mobileMenu?"mobile-open":""}`}>
        <div className="brand">
          <span className="brand-mark">K</span>
          <span>
            KRONOS <small>OPERAÇÃO 100K</small>
          </span>
        </div>
        <button className="mobile-menu-close" onClick={()=>setMobileMenu(false)} aria-label="Fechar menu"><X/></button>
        <nav>
          <p>VISÃO</p>
          {nav("Visão geral", <LayoutDashboard />)}
          {nav("Hoje", <Gauge />)}
          {nav("O que fazer", <ClipboardList />)}
          {nav("Contagens", <Layers3 />)}
          <p>EXECUÇÃO</p>
          {nav("Ligações", <Phone />)}
          {nav("Leads", <Users />)}
          {nav("Follow-ups", <CalendarDays />)}
          <p>VENDAS</p>
          {nav("Pipeline", <Target />)}
          {nav("Vendas", <CircleDollarSign />)}
          <p>ANÁLISE</p>
          {nav("Performance", <BarChart3 />)}
          {nav("Simulador R$100K", <Gauge />)}
          {nav("Configurações", <Settings />)}
        </nav>
        <div className="sidebar-foot">
          <span className="avatar">MR</span>
          <span>
            Minha operação<small>DADOS PESSOAIS</small>
          </span>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              {campaign.title.toUpperCase()} · DIA {elapsed} DE{" "}
              {campaign.totalDays}
            </span>
            <h1>{view}</h1>
          </div>
          <div className="actions">
            <button className="icon-btn">
              <Bell />
            </button>
            <button className="secondary" onClick={() => setModal("call")}>
              <Plus /> Nova ligação
            </button>
            <button className="primary" onClick={() => setModal("sale")}>
              <Plus /> Registrar venda
            </button>
          </div>
          <button className="top-mobile-menu" onClick={()=>setMobileMenu(true)} aria-label="Abrir menu"><Menu/></button>
        </header>
        {view === "Visão geral" || view === "Hoje" ? (
          <>
            <div className="status-strip">
              <span className="status-dot" />
              <strong>
                {revenue
                  ? "Ritmo calculado pelos seus registros"
                  : "Operação iniciada"}
              </strong>
              <span>
                {money(remaining)} restantes · {money(daily)}/dia necessário.
              </span>
              <button onClick={() => setView("Simulador R$100K")}>
                Abrir simulador <ChevronRight />
              </button>
            </div>
            <section className="revenue-panel">
              <div className="revenue-copy">
                <span className="eyebrow">FATURAMENTO ACUMULADO</span>
                <div className="money">{money(revenue)}</div>
                <div className="goal-line">
                  <span>de {money(target)}</span>
                  <span>{((revenue / target) * 100).toFixed(1)}%</span>
                </div>
                <div className="progress">
                  <i style={{ width: `${Math.min(revenue / 1000, 100)}%` }} />
                </div>
                <div className="revenue-meta">
                  <span>
                    <small>RESTANTE</small>
                    {money(remaining)}
                  </span>
                  <span>
                    <small>DIAS RESTANTES</small>
                    {days}
                  </span>
                  <span>
                    <small>TICKET MÉDIO</small>
                    {money(avg)}
                  </span>
                </div>
              </div>
              <div className="chart-wrap">
                <div className="chart-head">
                  <span>Trajetória de faturamento</span>
                  <span className="legend">
                    <i /> Real <i /> Ideal
                  </span>
                </div>
                <svg viewBox="0 0 520 210">
                  <g className="grid">
                    <line x1="8" y1="176" x2="510" y2="176" />
                    <line x1="8" y1="126" x2="510" y2="126" />
                    <line x1="8" y1="76" x2="510" y2="76" />
                    <line x1="8" y1="26" x2="510" y2="26" />
                  </g>
                  <path className="ideal" d="M8 176 L510 26" />
                  <path
                    className="real"
                    d={`M8 176 L${8 + Math.min(revenue / 100000, 1) * 502} ${176 - Math.min(revenue / 100000, 1) * 150}`}
                  />
                </svg>
                <div className="axis">
                  <span>Dia 1</span>
                  <span>Dia 8</span>
                  <span>Dia 15</span>
                  <span>Dia 22</span>
                  <span>Dia 30</span>
                </div>
              </div>
            </section>
            <section className="content-grid">
              <div className="today-panel">
                <div className="section-head">
                  <div>
                    <span className="eyebrow">EXECUÇÃO DE HOJE</span>
                    <h2>{todayCalls} de 80 ligações</h2>
                  </div>
                  <strong>{Math.round((todayCalls / 80) * 100)}%</strong>
                </div>
                <div className="thin-progress">
                  <i
                    style={{
                      width: `${Math.min((todayCalls / 80) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="niche-list">
                  {initialNiches.map(([n, t]) => (
                    <div className="niche" key={n}>
                      <span>{n}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.min((nicheDone(n) / t) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <b className={nicheDone(n) >= t ? "done" : ""}>
                        {nicheDone(n)} / {t}
                      </b>
                    </div>
                  ))}
                </div>
                <button
                  className="wide-action"
                  onClick={() => setModal("call")}
                >
                  <Plus /> Registrar ligação <kbd>⌘ L</kbd>
                </button>
              </div>
              <div className="right-stack">
                <div className="followups">
                  <div className="section-head">
                    <div>
                      <span className="eyebrow">PRIORIDADE</span>
                      <h2>Próximas ações</h2>
                    </div>
                    <button onClick={() => setView("Follow-ups")}>
                      Ver todas
                    </button>
                  </div>
                  {leads.slice(0, 3).map((l, i) => (
                    <div className="followup" key={l.id}>
                      <span className={`f-dot f${i}`} />
                      <span>
                        <b>{l.company}</b>
                        <small>{l.status}</small>
                      </span>
                      <time>{l.next || "—"}</time>
                    </div>
                  ))}
                  {!leads.length ? (
                    <div className="empty">
                      Nenhuma ação pendente.
                      <button onClick={() => setModal("lead")}>
                        Adicionar lead
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="mini-metrics">
                  <span>
                    <small>VENDAS NO MÊS</small>
                    <b>{sold}</b>
                    <em>{money(revenue)} faturados</em>
                  </span>
                  <span>
                    <small>TAXA DE FECHAMENTO</small>
                    <b>{closeRate.toFixed(1)}%</b>
                    <em className="neutral">
                      {calls.length} contatos registrados
                    </em>
                  </span>
                </div>
              </div>
            </section>
          </>
        ) : view === "O que fazer" ? (
          <TodoPlan campaign={campaign} calls={calls} sales={sales} />
        ) : view === "Contagens" ? (
          <CampaignManager current={campaign} />
        ) : view === "Ligações" ? (
          <CallTable
            calls={calls}
            action={() => setModal("call")}
            remove={removeCall}
          />
        ) : view === "Leads" || view === "Follow-ups" ? (
          <>
            <div className="list-head">
              <div className="search">
                <Search />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar empresa, nicho ou status"
                />
              </div>
              <button
                className="primary standalone"
                onClick={() => setModal("lead")}
              >
                <Plus /> Novo lead
              </button>
            </div>
            <TableView
              title={view}
              action={() => setModal("lead")}
              rows={leads
                .filter((l) =>
                  JSON.stringify(l)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((l) => [
                  l.company,
                  l.niche,
                  l.status,
                  money(l.potential),
                  l.next,
                ])}
            />
          </>
        ) : view === "Vendas" ? (
          <TableView
            title="Vendas e recebimentos"
            action={() => setModal("sale")}
            rows={sales.map((s) => [
              s.company,
              s.type,
              money(s.value),
              money(s.received),
              s.date,
            ])}
          />
        ) : view === "Pipeline" ? (
          <Pipeline
            calls={calls.length}
            leads={leads.length}
            sales={sales.length}
          />
        ) : view === "Simulador R$100K" ? (
          <Simulator remaining={remaining} />
        ) : view === "Configurações" ? (
          <SettingsView restart={() => setCampaign(null)} />
        ) : (
          <Performance calls={calls} sales={sales} />
        )}
      </section>
      {modal ? (
        <Modal
          type={modal}
          close={() => setModal(null)}
          addCall={async (x) => {
            await save("call", x);
            setCalls((v) => [x, ...v]);
          }}
          addSale={async (x) => {
            await save("sale", x);
            setSales((v) => [x, ...v]);
          }}
          addLead={async (x) => {
            await save("lead", x);
            setLeads((v) => [x, ...v]);
          }}
        />
      ) : null}
    </main>
  );
}
function CallTable({
  calls,
  action,
  remove,
}: {
  calls: Call[];
  action: () => void;
  remove: (id: number) => void;
}) {
  return (
    <section className="table-panel">
      <div className="table-title">
        <div>
          <span className="eyebrow">REGISTROS REAIS</span>
          <h2>Ligações registradas</h2>
        </div>
        <button onClick={action}>
          <Plus /> Adicionar
        </button>
      </div>
      {calls.length ? (
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Nicho</th>
              <th>Resultado</th>
              <th>Data</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id}>
                <td>{c.company}</td>
                <td>{c.niche}</td>
                <td>{c.result}</td>
                <td>{c.date}</td>
                <td className="action-cell">
                  <button
                    className="delete-btn"
                    onClick={() => remove(c.id)}
                    aria-label={`Remover ligação de ${c.company}`}
                    title="Remover ligação"
                  >
                    <Trash2 /> Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="big-empty">
          <span>Nenhuma ligação registrada</span>
          <p>Use a ação acima para criar o primeiro registro.</p>
        </div>
      )}
    </section>
  );
}
function TableView({
  title,
  rows,
  action,
}: {
  title: string;
  rows: (string | number)[][];
  action: () => void;
}) {
  return (
    <section className="table-panel">
      <div className="table-title">
        <div>
          <span className="eyebrow">REGISTROS REAIS</span>
          <h2>{title}</h2>
        </div>
        <button onClick={action}>
          <Plus /> Adicionar
        </button>
      </div>
      {rows.length ? (
        <table>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="big-empty">
          <span>Nenhum registro ainda</span>
          <p>Use a ação acima para criar o primeiro registro.</p>
        </div>
      )}
    </section>
  );
}
function Pipeline({
  calls,
  leads,
  sales,
}: {
  calls: number;
  leads: number;
  sales: number;
}) {
  const stages = [
    ["Prospectadas", Math.max(calls, leads)],
    ["Conversas", calls],
    ["Interessados", leads],
    ["Propostas", leads ? Math.floor(leads * 0.5) : 0],
    ["Vendas", sales],
  ];
  return (
    <section className="table-panel">
      <span className="eyebrow">CONVERSÃO COMERCIAL</span>
      <h2>Funil da operação</h2>
      <div className="funnel">
        {stages.map((s, i) => (
          <div key={s[0]} style={{ width: `${100 - i * 10}%` }}>
            <span>{s[0]}</span>
            <b>{s[1]}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
function Simulator({ remaining }: { remaining: number }) {
  const [ticket, setTicket] = useState(3000),
    [rate, setRate] = useState(1),
    [days, setDays] = useState(20);
  const clients = Math.ceil(remaining / ticket),
    prospects = Math.ceil(clients / (rate / 100));
  return (
    <section className="sim">
      <div>
        <span className="eyebrow">CENÁRIO DINÂMICO</span>
        <h2>Simulador R$100K</h2>
        <label>
          Ticket médio
          <input
            type="number"
            value={ticket}
            onChange={(e) => setTicket(+e.target.value)}
          />
        </label>
        <label>
          Conversão (%)
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(+e.target.value)}
          />
        </label>
        <label>
          Dias trabalhados
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(+e.target.value)}
          />
        </label>
      </div>
      <div className="sim-result">
        <small>META RESTANTE</small>
        <b>{money(remaining)}</b>
        <p>
          Você precisa de <strong>{clients} vendas</strong> e aproximadamente{" "}
          <strong>{prospects.toLocaleString("pt-BR")} prospects</strong>.
        </p>
        <span>{Math.ceil(prospects / days)} contatos por dia</span>
      </div>
    </section>
  );
}
function Performance({ calls, sales }: { calls: Call[]; sales: Sale[] }) {
  return (
    <section className="table-panel">
      <span className="eyebrow">ANÁLISE POR NICHO</span>
      <h2>Performance comercial</h2>
      <table>
        <tbody>
          {initialNiches.map(([n]) => {
            const c = calls.filter((x) => x.niche === n).length;
            return (
              <tr key={n}>
                <td>{n}</td>
                <td>{c} ligações</td>
                <td>
                  {sales.length
                    ? money(sales.reduce((a, s) => a + s.value, 0))
                    : "Sem vendas"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
function CampaignManager({ current,landing=false,onEnter }: { current: Campaign;landing?:boolean;onEnter?:()=>void }) {
  const [items, setItems] = useState<Campaign[]>([]),
    [creating, setCreating] = useState(false),
    [title, setTitle] = useState("Nova contagem"),
    [days, setDays] = useState(30),
    [target, setTarget] = useState(100000),
    [busy, setBusy] = useState(false);
  const load = () =>
    apiFetch("/api/data")
      .then((r) => r.json())
      .then((d) => setItems(d.campaigns || []));
  useEffect(() => {
    load().catch(() => {});
  }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const item = {
      id: Date.now(),
      title,
      startDate: new Date().toISOString().slice(0, 10),
      totalDays: days,
      target,
      active: false,
    };
    const r = await apiFetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "campaign", item }),
    });
    setBusy(false);
    if (!r.ok) return window.alert("Não foi possível criar a contagem.");
    setCreating(false);
    await load();
  };
  const activate = async (id: number) => {
    const r = await apiFetch("/api/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "activateCampaign", item: { id } }),
    });
    if (r.ok) window.location.reload();
  };
  const remove = async (item: Campaign) => {
    if (!window.confirm(`Excluir a contagem “${item.title}”?`)) return;
    const r = await apiFetch(`/api/data?kind=campaign&id=${item.id}`, {
      method: "DELETE",
    });
    if (!r.ok) return window.alert("Não foi possível excluir a contagem.");
    if (item.id === current.id) window.location.reload();
    else await load();
  };
  return (
    <section className="campaign-page">
      <div className="campaign-heading">
        <div>
          <span className="eyebrow">{landing?"INÍCIO":"GERENCIAMENTO"}</span>
          <h2>{landing?"Escolha uma contagem":"Suas contagens"}</h2>
          <p>{landing?"Abra uma contagem existente ou crie um novo ciclo.":"Crie outros ciclos sem interromper a contagem que está ativa."}</p>
        </div>
        <button
          className="primary standalone"
          onClick={() => setCreating(true)}
        >
          <Plus /> Nova contagem
        </button>
      </div>
      <div className="campaign-list">
        {items.map((item) => {
          const isActive = Boolean(item.active);
          const elapsed = Math.max(
            1,
            Math.min(
              item.totalDays,
              Math.floor(
                (Date.now() -
                  new Date(`${item.startDate}T00:00:00`).getTime()) /
                  86400000,
              ) + 1,
            ),
          );
          const progress = Math.round((elapsed / item.totalDays) * 100);
          return (
            <article
              className={`campaign-item ${isActive ? "active" : ""}`}
              key={item.id}
            >
              <div className="campaign-card-top">
                <div className="campaign-status">
                  {isActive ? "● CONTAGEM ATIVA" : "CONTAGEM SECUNDÁRIA"}
                </div>
                <span>{progress}% do período</span>
              </div>
              <div className="campaign-main">
                <h3>{item.title}</h3>
                <span>Iniciada em {new Date(`${item.startDate}T12:00:00`).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="campaign-day"><div><small>DIA ATUAL</small><b>{elapsed}</b></div><span>de {item.totalDays} dias</span></div>
              <div className="campaign-period-bar"><i style={{width:`${progress}%`}} /></div>
              <div className="campaign-target">
                <small>META DE FATURAMENTO</small>
                <b>{money(item.target)}</b>
              </div>
              <div className="campaign-actions">
                {!isActive ? (
                  <button onClick={() => activate(item.id)}>
                    Tornar ativa
                  </button>
                ) : landing ? (
                  <button className="campaign-open" onClick={onEnter}>Abrir contagem</button>
                ) : (<span>Em andamento</span>)}
                <button
                  className="campaign-delete"
                  onClick={() => remove(item)}
                >
                  <Trash2 /> Excluir
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {creating ? (
        <div
          className="modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setCreating(false)
          }
        >
          <form className="modal" onSubmit={create}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">CONTAGEM SECUNDÁRIA</span>
                <h2>Criar nova contagem</h2>
              </div>
              <button type="button" onClick={() => setCreating(false)}>
                <X />
              </button>
            </div>
            <label>
              Nome
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label>
              Duração em dias
              <input
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(+e.target.value)}
                required
              />
            </label>
            <label>
              Meta de faturamento
              <input
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(+e.target.value)}
                required
              />
            </label>
            <p className="secondary-note">
              Ela será criada como secundária. Sua contagem atual continuará
              ativa.
            </p>
            <button className="submit" disabled={busy}>
              {busy ? "Criando..." : "Criar contagem secundária"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function TodoPlan({
  campaign,
  calls,
  sales,
}: {
  campaign: Campaign;
  calls: Call[];
  sales: Sale[];
}) {
  const plan = buildAIPlan(campaign.target, campaign.totalDays);
  const callsLeft = Math.max(0, plan.prospects - calls.length);
  const revenue = sales.reduce(
    (total, sale) => total + Math.max(0, sale.value),
    0,
  );
  const revenueLeft = Math.max(0, campaign.target - revenue);
  const completedByType = (type: string) =>
    sales.filter((s) => s.type === type).length;
  const totalSites = plan.mix.reduce((total, item) => total + item[2], 0);
  const completedSites = sales.length;
  return (
    <section className="todo-page">
      <div className="todo-hero">
        <div>
          <span className="ai-badge">
            <ClipboardList /> PLANO DE EXECUÇÃO
          </span>
          <h2>O que fazer nesta contagem</h2>
          <p>
            A lista abaixo é calculada para alcançar {money(campaign.target)} em{" "}
            {campaign.totalDays} dias.
          </p>
        </div>
        <div className="todo-progress">
          <small>FATURAMENTO RESTANTE</small>
          <b>{money(revenueLeft)}</b>
          <span>
            {Math.min(100, Math.round((revenue / campaign.target) * 100))}%
            concluído
          </span>
        </div>
      </div>
      <div className="todo-summary">
        <article>
          <small>LIGAÇÕES DO CICLO</small>
          <b>{plan.prospects.toLocaleString("pt-BR")}</b>
          <span>
            {calls.length} feitas · {callsLeft.toLocaleString("pt-BR")}{" "}
            restantes
          </span>
        </article>
        <article>
          <small>LIGAÇÕES POR DIA</small>
          <b>{plan.callsPerDay}</b>
          <span>Ritmo recomendado</span>
        </article>
        <article>
          <small>SITES PARA VENDER</small>
          <b>{totalSites}</b>
          <span>
            {completedSites} vendidos ·{" "}
            {Math.max(0, totalSites - completedSites)} restantes
          </span>
        </article>
        <article>
          <small>META POR DIA</small>
          <b>{money(plan.daily)}</b>
          <span>Faturamento necessário</span>
        </article>
      </div>
      <div className="todo-grid">
        <section className="todo-card">
          <div className="todo-card-head">
            <div>
              <span className="eyebrow">VENDAS NECESSÁRIAS</span>
              <h3>Sites por categoria</h3>
            </div>
            <span>Preço unitário</span>
          </div>
          {plan.mix.map(([name, price, total]) => {
            const done = completedByType(name),
              left = Math.max(0, total - done);
            return (
              <div className="product-task" key={name}>
                <div className={left === 0 ? "task-check done" : "task-check"}>
                  {left === 0 ? "✓" : done}
                </div>
                <div>
                  <b>{name}</b>
                  <small>
                    {done} vendidos · {left} restantes de {total}
                  </small>
                  <div className="task-bar">
                    <i
                      style={{
                        width: `${Math.min(100, (done / total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <strong>{money(price)}</strong>
              </div>
            );
          })}
        </section>
        <section className="todo-card">
          <div className="todo-card-head">
            <div>
              <span className="eyebrow">PROSPECÇÃO</span>
              <h3>Ligações por nicho</h3>
            </div>
            <span>{callsLeft.toLocaleString("pt-BR")} restantes</span>
          </div>
          {initialNiches.map(([name, weight]) => {
            const target = Math.ceil((plan.prospects * weight) / 80),
              done = calls.filter((c) => c.niche === name).length,
              offer = nicheOffer[name];
            return (
              <div className="call-task" key={name}>
                <div className="niche-offer">
                  <span>{name}</span>
                  <em>
                    {offer.category} · {money(offer.price)}
                  </em>
                </div>
                <div className="task-bar">
                  <i
                    style={{
                      width: `${Math.min(100, (done / target) * 100)}%`,
                    }}
                  />
                </div>
                <b>
                  {done} / {target}
                </b>
              </div>
            );
          })}
        </section>
      </div>
      <p className="todo-footnote">
        O plano usa conversão estimada de 1,2% e ticket médio de R$ 3.000. Os
        números concluídos são atualizados pelos registros de ligações e vendas.
      </p>
    </section>
  );
}

function AIPlan({
  target,
  days,
  compact = false,
}: {
  target: number;
  days: number;
  compact?: boolean;
}) {
  const plan = buildAIPlan(target, days);
  return (
    <section className={`ai-plan ${compact ? "compact" : ""}`}>
      <div className="ai-title">
        <span className="ai-badge">
          <Sparkles /> IA DE PLANEJAMENTO
        </span>
        <h2>Plano criado para {money(target)}</h2>
        <p>
          A estratégia se adapta automaticamente à meta e ao prazo escolhidos.
        </p>
      </div>
      <div className="ai-stats">
        <span>
          <small>META POR DIA</small>
          <b>{money(plan.daily)}</b>
        </span>
        <span>
          <small>CLIENTES ESTIMADOS</small>
          <b>{plan.clients}</b>
        </span>
        <span>
          <small>CONTATOS POR DIA</small>
          <b>{plan.callsPerDay}</b>
        </span>
        <span>
          <small>PROSPECTS NO CICLO</small>
          <b>{plan.prospects.toLocaleString("pt-BR")}</b>
        </span>
      </div>
      <div className="ai-columns">
        <div>
          <h3>Metas de progresso</h3>
          {plan.weeks.map((w) => (
            <div className="ai-row" key={w.label}>
              <span>{w.label}</span>
              <b>{money(w.value)}</b>
            </div>
          ))}
        </div>
        <div>
          <h3>Mix de ofertas sugerido</h3>
          {plan.mix.map(([name, price, count]) => (
            <div className="ai-row" key={name}>
              <span>
                {count}× {name}
              </span>
              <b>{money(price)}</b>
            </div>
          ))}
        </div>
      </div>
      <small className="ai-note">
        Estimativa baseada em ticket médio de R$ 3.000 e conversão comercial de
        1,2%. O plano se recalcula quando a meta muda.
      </small>
    </section>
  );
}
function SettingsView({ restart }: { restart: () => void }) {
  const [active, setActive] = useState<Campaign | null>(null);
  useEffect(() => {
    apiFetch("/api/data")
      .then((r) => r.json())
      .then((d) => setActive(d.campaign || null))
      .catch(() => {});
  }, []);
  return (
    <section className="settings-page">
      {active ? (
        <AIPlan target={active.target} days={active.totalDays} />
      ) : null}
      <section className="table-panel">
        <span className="eyebrow">NOVA OPERAÇÃO</span>
        <h2>Quer escolher outra meta?</h2>
        <p className="settings-copy">
          Crie uma nova contagem para a IA recalcular todo o plano de
          faturamento.
        </p>
        <button className="restart-btn" onClick={restart}>
          Criar nova contagem
        </button>
      </section>
    </section>
  );
}
function CountdownSetup({
  create,
}: {
  create: (campaign: Campaign) => Promise<void>;
}) {
  const [title, setTitle] = useState("Operação 100K"),
    [days, setDays] = useState(30),
    [target, setTarget] = useState(100000),
    [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await create({
        id: Date.now(),
        title,
        startDate: new Date().toISOString().slice(0, 10),
        totalDays: days,
        target,
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="countdown-screen">
      <div className="countdown-layout">
        <section className="countdown-card">
          <div className="countdown-brand">
            <span className="brand-mark">K</span> KRONOS
          </div>
          <span className="eyebrow">NOVA CONTAGEM</span>
          <h1>Escolha sua meta. A IA monta o plano.</h1>
          <p>
            Altere o faturamento ou a duração e veja as metas de execução serem
            calculadas na hora.
          </p>
          <form onSubmit={submit}>
            <label>
              Nome da contagem
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <div className="countdown-fields">
              <label>
                Duração em dias
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={days}
                  onChange={(e) => setDays(+e.target.value)}
                  required
                />
              </label>
              <label>
                Meta de faturamento
                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(+e.target.value)}
                  required
                />
              </label>
            </div>
            <button disabled={saving}>
              {saving ? "Criando contagem..." : "Aceitar plano e começar"}
            </button>
          </form>
          <small>
            A contagem começa em {new Date().toLocaleDateString("pt-BR")}.
          </small>
        </section>
        <AIPlan target={target} days={days} compact />
      </div>
    </main>
  );
}
function Modal({
  type,
  close,
  addCall,
  addSale,
  addLead,
}: {
  type: "call" | "sale" | "lead";
  close: () => void;
  addCall: (x: Call) => void;
  addSale: (x: Sale) => void;
  addLead: (x: Lead) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now(),
      date = new Date().toLocaleDateString("pt-BR");
    if (type === "call")
      addCall({
        id,
        company: form.company || "Empresa",
        niche: form.niche || initialNiches[0][0],
        result: form.result || "Não atendeu",
        date,
      });
    if (type === "sale")
      addSale({
        id,
        company: form.company || "Cliente",
        type: form.type || "Site Express",
        value: +form.value || 0,
        received: +form.received || 0,
        date,
      });
    if (type === "lead")
      addLead({
        id,
        company: form.company || "Empresa",
        niche: form.niche || initialNiches[0][0],
        status: form.status || "Novo",
        potential: +form.potential || 0,
        next: form.next || "",
      });
    close();
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">AÇÃO RÁPIDA</span>
            <h2>
              {type === "call"
                ? "Registrar ligação"
                : type === "sale"
                  ? "Registrar venda"
                  : "Novo lead"}
            </h2>
          </div>
          <button type="button" onClick={close}>
            <X />
          </button>
        </div>
        <label>
          Empresa
          <input
            required
            autoFocus
            onChange={(e) => set("company", e.target.value)}
            placeholder="Nome da empresa"
          />
        </label>
        {type !== "sale" ? (
          <label>
            Nicho
            <select onChange={(e) => set("niche", e.target.value)}>
              {initialNiches.map((n) => (
                <option key={n[0]}>{n[0]}</option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Tipo de site
            <select onChange={(e) => set("type", e.target.value)}>
              <option>Site Express</option>
              <option>Site Profissional</option>
              <option>Site Premium</option>
              <option>Projeto High Ticket</option>
            </select>
          </label>
        )}
        {type === "call" ? (
          <label>
            Resultado
            <select onChange={(e) => set("result", e.target.value)}>
              {[
                "Não atendeu",
                "Falou com decisor",
                "Pediu WhatsApp",
                "Demonstrou interesse",
                "Reunião marcada",
                "Proposta solicitada",
                "Venda fechada",
                "Sem interesse",
                "Retornar depois",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        ) : type === "sale" ? (
          <>
            <label>
              Valor fechado
              <input
                type="number"
                required
                onChange={(e) => set("value", e.target.value)}
              />
            </label>
            <label>
              Valor recebido
              <input
                type="number"
                onChange={(e) => set("received", e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Status
              <select onChange={(e) => set("status", e.target.value)}>
                {[
                  "Novo",
                  "Tentativa de contato",
                  "Contato feito",
                  "Interessado",
                  "Reunião",
                  "Proposta",
                  "Negociação",
                  "Cliente",
                  "Perdido",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Valor potencial
              <input
                type="number"
                onChange={(e) => set("potential", e.target.value)}
              />
            </label>
            <label>
              Próxima ação
              <input
                type="date"
                onChange={(e) => set("next", e.target.value)}
              />
            </label>
          </>
        )}
        <button className="submit">Salvar registro</button>
      </form>
    </div>
  );
}

