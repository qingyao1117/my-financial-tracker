import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, Building2,
  Newspaper, PieChart as PieChartIcon, LayoutDashboard, Calendar,
  Tag, DollarSign, Percent, Clock, ChevronRight, X, BarChart2,
  BookOpen, TrendingDown as TDIcon, Activity, Globe, Cpu, Heart,
  Zap, ShoppingBag, Home, Car, Landmark, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid
} from "recharts";

const COLORS = ["#6366f1","#22d3ee","#f59e0b","#10b981","#f43f5e","#a78bfa","#34d399","#fb923c"];
const IN_CATS = ["Salary","Business","Freelance","Savings","Others"];
const OUT_CATS = ["Food","Transport","Shopping","Bills","Entertainment","Health","Education","Club Activities","Others"];
const INV_TYPES = ["Stocks","ETF","Unit Trust","Crypto","Bonds","REITs","Others"];
const INV_SECTORS = ["Technology","Healthcare","Finance","Energy","Consumer","Industrial","Real Estate","Utilities","Others"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmtRM = v => `RM ${Number(v).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const today = () => new Date().toISOString().split("T")[0];
const thisYear = new Date().getFullYear();
const thisMonth = new Date().getMonth();

const calcFD = (p,r,m) => { const pv=parseFloat(p)||0,rv=parseFloat(r)||0,mv=parseFloat(m)||0; return pv+(pv*rv/100*mv/12); };
const addMonths = (d,m) => { if(!d)return""; const dt=new Date(d); dt.setMonth(dt.getMonth()+parseInt(m||0)); return dt.toLocaleDateString("en-MY",{day:"2-digit",month:"short",year:"numeric"}); };

const LS = { get:(k,d)=>{ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} }, set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} } };

const NEWS = [
  {title:"Bursa Malaysia opens higher on foreign buying momentum",source:"The Edge Markets",time:"2h ago",tag:"Market",local:true,emoji:"📈"},
  {title:"Bank Negara holds OPR at 3.00% amid stable inflation",source:"Bernama",time:"4h ago",tag:"Policy",local:true,emoji:"🏦"},
  {title:"Ringgit strengthens against USD as exports beat forecast",source:"Malay Mail",time:"6h ago",tag:"Currency",local:true,emoji:"💱"},
  {title:"Top Malaysian REITs to watch in Q2 2025",source:"iMoney Malaysia",time:"8h ago",tag:"Investing",local:true,emoji:"🏢"},
  {title:"Fed signals rate cuts in second half of 2025",source:"Reuters",time:"1h ago",tag:"Global",local:false,emoji:"🇺🇸"},
  {title:"China GDP growth surpasses expectations at 5.3%",source:"CNBC",time:"3h ago",tag:"Global",local:false,emoji:"🇨🇳"},
  {title:"Gold prices hit all-time high amid geopolitical tensions",source:"Bloomberg",time:"5h ago",tag:"Commodities",local:false,emoji:"🥇"},
  {title:"S&P 500 closes at record as tech earnings impress",source:"FT",time:"7h ago",tag:"Markets",local:false,emoji:"📊"},
];

const SECTOR_ANALYSIS = [
  {sector:"Technology",icon:"💻",trend:"up",change:+12.4,desc:"AI boom drives semiconductor & cloud stocks. Strong buy sentiment.",rating:"Strong Buy",color:"#6366f1",picks:["NVDA","MSFT","AMD"],risk:"Medium"},
  {sector:"Healthcare",icon:"🏥",trend:"up",change:+5.1,desc:"Biotech rebound post-FDA approvals. Defensive play in volatile market.",rating:"Buy",color:"#10b981",picks:["JNJ","UNH","PFE"],risk:"Low"},
  {sector:"Finance",icon:"🏦",trend:"neutral",change:+1.2,desc:"Higher rates benefit banks but credit risk rising. Selective picks.",rating:"Hold",color:"#f59e0b",picks:["JPM","BAC","GS"],risk:"Medium"},
  {sector:"Energy",icon:"⚡",trend:"down",change:-3.7,desc:"Oil demand uncertainty amid EV transition. Renewables outperforming.",rating:"Underweight",color:"#f43f5e",picks:["XOM","CVX","NEE"],risk:"High"},
  {sector:"Consumer",icon:"🛒",trend:"neutral",change:+0.8,desc:"Mixed signals — discretionary weak, staples resilient.",rating:"Hold",color:"#22d3ee",picks:["AMZN","WMT","COST"],risk:"Medium"},
  {sector:"Real Estate",icon:"🏠",trend:"up",change:+3.2,desc:"REITs recovering as rate cut expectations rise. Malaysia REITs attractive.",rating:"Buy",color:"#a78bfa",picks:["IGB REIT","KLCC","PavREIT"],risk:"Low"},
];

const inp = (val,onChange,extra={}) => ({
  value:val, onChange:e=>onChange(e.target.value),
  style:{width:"100%",background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",color:"#e2e8f0",fontSize:13,boxSizing:"border-box"},
  ...extra
});

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState(()=>LS.get("fd_txns2",[]));
  const [fds, setFds] = useState(()=>LS.get("fd_fds2",[]));
  const [investments, setInvestments] = useState(()=>LS.get("fd_inv2",[]));
  const [newsFilter, setNewsFilter] = useState("all");
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [showFdForm, setShowFdForm] = useState(false);
  const [showInvForm, setShowInvForm] = useState(false);
  const [monthlyView, setMonthlyView] = useState({year:thisYear,month:thisMonth});
  const [txnForm, setTxnForm] = useState({type:"out",desc:"",amount:"",category:"Food",date:today()});
  const [fdForm, setFdForm] = useState({bank:"",principal:"",rate:"",months:"",startDate:today()});
  const [invForm, setInvForm] = useState({name:"",type:"Stocks",sector:"Technology",units:"",buyPrice:"",currentPrice:"",date:today()});

  useEffect(()=>LS.set("fd_txns2",transactions),[transactions]);
  useEffect(()=>LS.set("fd_fds2",fds),[fds]);
  useEffect(()=>LS.set("fd_inv2",investments),[investments]);

const totalIn = useMemo(()=>transactions.filter(t=>t.type==="in").reduce((a,t)=>a+t.amount,0),[transactions]);
  const totalOut = useMemo(()=>transactions.filter(t=>t.type==="out").reduce((a,t)=>a+t.amount,0),[transactions]);
  const balance = totalIn-totalOut;
  const totalFD = useMemo(()=>fds.reduce((a,f)=>a+calcFD(f.principal,f.rate,f.months),0),[fds]);
  const totalInvValue = useMemo(()=>investments.reduce((a,i)=>a+(parseFloat(i.currentPrice||0)*parseFloat(i.units||0)),0),[investments]);
  const totalInvCost = useMemo(()=>investments.reduce((a,i)=>a+(parseFloat(i.buyPrice||0)*parseFloat(i.units||0)),0),[investments]);
  const invPnL = totalInvValue-totalInvCost;

  const monthTxns = useMemo(()=>transactions.filter(t=>{ const d=new Date(t.date); return d.getMonth()===monthlyView.month&&d.getFullYear()===monthlyView.year; }),[transactions,monthlyView]);
  const monthIn = useMemo(()=>monthTxns.filter(t=>t.type==="in").reduce((a,t)=>a+t.amount,0),[monthTxns]);
  const monthOut = useMemo(()=>monthTxns.filter(t=>t.type==="out").reduce((a,t)=>a+t.amount,0),[monthTxns]);

  const pieData = useMemo(()=>{ const m={}; transactions.filter(t=>t.type==="out").forEach(t=>{m[t.category]=(m[t.category]||0)+t.amount;}); return Object.entries(m).map(([name,value])=>({name,value})); },[transactions]);
  const monthlyBarData = useMemo(()=>MONTHS.map((m,i)=>({ month:m, In:transactions.filter(t=>t.type==="in"&&new Date(t.date).getMonth()===i&&new Date(t.date).getFullYear()===monthlyView.year).reduce((a,t)=>a+t.amount,0), Out:transactions.filter(t=>t.type==="out"&&new Date(t.date).getMonth()===i&&new Date(t.date).getFullYear()===monthlyView.year).reduce((a,t)=>a+t.amount,0) })),[transactions,monthlyView.year]);

  const sectorInvData = useMemo(()=>{ const m={}; investments.forEach(i=>{const v=parseFloat(i.currentPrice||0)*parseFloat(i.units||0); m[i.sector]=(m[i.sector]||0)+v;}); return Object.entries(m).map(([name,value])=>({name,value})); },[investments]);

  const addTxn=()=>{ if(!txnForm.desc||!txnForm.amount)return; setTransactions(p=>[{id:Date.now(),...txnForm,amount:parseFloat(txnForm.amount)},...p]); setTxnForm({type:"out",desc:"",amount:"",category:"Food",date:today()}); setShowTxnForm(false); };
  const addFd=()=>{ if(!fdForm.principal||!fdForm.rate||!fdForm.months)return; setFds(p=>[{id:Date.now(),...fdForm},...p]); setFdForm({bank:"",principal:"",rate:"",months:"",startDate:today()}); setShowFdForm(false); };
  const addInv=()=>{ if(!invForm.name||!invForm.units||!invForm.buyPrice)return; setInvestments(p=>[{id:Date.now(),...invForm},...p]); setInvForm({name:"",type:"Stocks",sector:"Technology",units:"",buyPrice:"",currentPrice:"",date:today()}); setShowInvForm(false); };

  const card = (children,extra={}) => <div style={{background:"#111827",border:"1px solid #1e293b",borderRadius:12,padding:20,...extra}}>{children}</div>;
  const sLabel = (t) => <div style={{fontSize:11,color:"#64748b",marginBottom:4,letterSpacing:1}}>{t}</div>;
  const ttStyle = {background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0",fontSize:12};

  const TABS = [
    {id:"dashboard",label:"Dashboard",icon:<LayoutDashboard size={13}/>},
    {id:"monthly",label:"Monthly",icon:<BookOpen size={13}/>},
    {id:"cash",label:"Cash Tracker",icon:<DollarSign size={13}/>},
    {id:"fd",label:"FD Manager",icon:<Building2 size={13}/>},
    {id:"investment",label:"Investment",icon:<BarChart2 size={13}/>},
    {id:"news",label:"Market Pulse",icon:<Newspaper size={13}/>},
  ];

return (
    <div style={{background:"#0a0f1e",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Inter',sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d1530,#111827)",borderBottom:"1px solid #1e293b",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"linear-gradient(135deg,#6366f1,#22d3ee)",borderRadius:8,padding:6,display:"flex"}}><Wallet size={18} color="#fff"/></div>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"#f1f5f9"}}>MyFinance<span style={{color:"#6366f1"}}>MY</span></div>
            <div style={{fontSize:10,color:"#64748b",letterSpacing:2,textTransform:"uppercase"}}>Personal Finance Dashboard</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#475569"}}>{new Date().toLocaleDateString("en-MY",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      </div>

      {/* Status Bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,padding:"14px 20px 0"}}>
        {[
          {label:"Net Balance",value:fmtRM(balance),color:"#6366f1",sub:balance>=0?"↑ Positive":"↓ Negative"},
          {label:"Monthly Spending",value:fmtRM(monthTxns.filter(t=>t.type==="out").reduce((a,t)=>a+t.amount,0)),color:"#f43f5e",sub:"This month"},
          {label:"Total Savings",value:fmtRM(transactions.filter(t=>t.category==="Savings").reduce((a,t)=>a+t.amount,0)),color:"#10b981",sub:"All time"},
          {label:"FD Value",value:fmtRM(totalFD),color:"#22d3ee",sub:`${fds.length} deposit(s)`},
          {label:"Investment P&L",value:fmtRM(invPnL),color:invPnL>=0?"#10b981":"#f43f5e",sub:invPnL>=0?"↑ Gain":"↓ Loss"},
        ].map((s,i)=>(
          <div key={i} style={{background:"linear-gradient(135deg,#111827,#1e293b)",border:"1px solid #1e293b",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:s.color,marginBottom:4,letterSpacing:1}}>{s.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9"}}>{s.value}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:2,padding:"14px 20px 0",borderBottom:"1px solid #1e293b",overflowX:"auto"}}>
        {TABS.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",fontSize:12,fontWeight:500,whiteSpace:"nowrap",background:tab===n.id?"linear-gradient(135deg,#6366f1,#4f46e5)":"transparent",color:tab===n.id?"#fff":"#64748b"}}>
            {n.icon}{n.label}
          </button>
        ))}
      </div>

      <div style={{padding:"18px 20px",maxWidth:1200,margin:"0 auto"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {card(<>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,color:"#a78bfa",fontWeight:600,fontSize:13}}><PieChartIcon size={15}/>Spending Breakdown</div>
              {pieData.length>0?(
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie><Tooltip formatter={v=>fmtRM(v)} contentStyle={ttStyle}/></PieChart>
                </ResponsiveContainer>
              ):<div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:12,flexDirection:"column",gap:8}}><PieChartIcon size={28}/>No spending data</div>}
            </>)}
            {card(<>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,color:"#34d399",fontWeight:600,fontSize:13}}><TrendingUp size={15}/>Recent Transactions</div>
                <button onClick={()=>{setTab("cash");setShowTxnForm(true);}} style={{background:"#6366f1",border:"none",borderRadius:6,padding:"3px 10px",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><Plus size={11}/>Add</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
                {transactions.slice(0,6).map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0f172a",borderRadius:8,padding:"7px 10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:t.type==="in"?"#10b981":"#f43f5e",flexShrink:0}}/>
                      <div><div style={{fontSize:12,color:"#e2e8f0"}}>{t.desc}</div><div style={{fontSize:10,color:"#475569"}}>{t.category} · {t.date}</div></div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:t.type==="in"?"#10b981":"#f43f5e"}}>{t.type==="in"?"+":"-"}{fmtRM(t.amount)}</div>
                  </div>
                ))}
                {!transactions.length&&<div style={{textAlign:"center",color:"#334155",fontSize:12,padding:20}}>No transactions yet</div>}
              </div>
            </>)}
            {card(<>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,color:"#22d3ee",fontWeight:600,fontSize:13}}><Building2 size={15}/>Active Fixed Deposits</div>
              {!fds.length?<div style={{textAlign:"center",color:"#334155",fontSize:12,padding:16}}>No FDs added</div>:(
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                  {fds.slice(0,4).map(f=>(
                    <div key={f.id} style={{background:"#0f172a",borderRadius:8,padding:10,border:"1px solid #22d3ee22"}}>
                      <div style={{fontSize:11,color:"#22d3ee",fontWeight:600}}>{f.bank||"FD"}</div>
                      <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9",marginTop:2}}>{fmtRM(calcFD(f.principal,f.rate,f.months))}</div>
                      <div style={{fontSize:10,color:"#475569"}}>{f.rate}% · {f.months}mo</div>
                    </div>
                  ))}
                </div>
              )}
            </>)}
            {card(<>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,color:"#f59e0b",fontWeight:600,fontSize:13}}><BarChart2 size={15}/>Investment Overview</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                {[{l:"Total Cost",v:fmtRM(totalInvCost),c:"#64748b"},{l:"Market Value",v:fmtRM(totalInvValue),c:"#22d3ee"},{l:"P&L",v:fmtRM(invPnL),c:invPnL>=0?"#10b981":"#f43f5e"},{l:"Holdings",v:`${investments.length}`,c:"#a78bfa"}].map((s,i)=>(
                  <div key={i} style={{background:"#0f172a",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#64748b"}}>{s.l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              {sectorInvData.length>0&&<ResponsiveContainer width="100%" height={90}>
                <PieChart><Pie data={sectorInvData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value">
                  {sectorInvData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie><Tooltip formatter={v=>fmtRM(v)} contentStyle={ttStyle}/></PieChart>
              </ResponsiveContainer>}
            </>)}
          </div>
        )}

{/* ── MONTHLY RECORD ── */}
        {tab==="monthly"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>Monthly Record</div><div style={{fontSize:12,color:"#475569"}}>Track income & expenses by month</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <select value={monthlyView.month} onChange={e=>setMonthlyView(p=>({...p,month:parseInt(e.target.value)}))} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:6,padding:"6px 10px",color:"#e2e8f0",fontSize:12}}>
                  {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
                </select>
                <select value={monthlyView.year} onChange={e=>setMonthlyView(p=>({...p,year:parseInt(e.target.value)}))} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:6,padding:"6px 10px",color:"#e2e8f0",fontSize:12}}>
                  {[thisYear-1,thisYear,thisYear+1].map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[{l:"Monthly Income",v:monthIn,c:"#10b981"},{l:"Monthly Expenses",v:monthOut,c:"#f43f5e"},{l:"Net Savings",v:monthIn-monthOut,c:(monthIn-monthOut)>=0?"#6366f1":"#f43f5e"}].map((s,i)=>(
                <div key={i} style={{background:"#111827",border:`1px solid ${s.c}33`,borderRadius:10,padding:"14px 16px"}}>
                  <div style={{fontSize:11,color:s.c,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{fmtRM(s.v)}</div>
                </div>
              ))}
            </div>

            {card(<>
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:14}}>Yearly Overview — {monthlyView.year}</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyBarData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="month" tick={{fill:"#475569",fontSize:11}}/>
                  <YAxis tick={{fill:"#475569",fontSize:10}} tickFormatter={v=>`RM${v>=1000?(v/1000).toFixed(0)+"k":v}`}/>
                  <Tooltip formatter={v=>fmtRM(v)} contentStyle={ttStyle}/>
                  <Bar dataKey="In" fill="#10b981" radius={[3,3,0,0]}/>
                  <Bar dataKey="Out" fill="#f43f5e" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </>,{marginBottom:14})}

            {card(<>
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:12}}>{MONTHS[monthlyView.month]} {monthlyView.year} Transactions ({monthTxns.length})</div>
              {!monthTxns.length?<div style={{textAlign:"center",color:"#334155",fontSize:12,padding:30}}>No transactions this month</div>:(
                <div>
                  {/* Category breakdown */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                    <div>
                      <div style={{fontSize:11,color:"#10b981",marginBottom:6}}>Income by Category</div>
                      {Object.entries(monthTxns.filter(t=>t.type==="in").reduce((a,t)=>({...a,[t.category]:(a[t.category]||0)+t.amount}),{})).map(([cat,amt])=>(
                        <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #0f172a",fontSize:12}}>
                          <span style={{color:"#94a3b8"}}>{cat}</span><span style={{color:"#10b981",fontWeight:600}}>{fmtRM(amt)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#f43f5e",marginBottom:6}}>Expenses by Category</div>
                      {Object.entries(monthTxns.filter(t=>t.type==="out").reduce((a,t)=>({...a,[t.category]:(a[t.category]||0)+t.amount}),{})).map(([cat,amt])=>(
                        <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #0f172a",fontSize:12}}>
                          <span style={{color:"#94a3b8"}}>{cat}</span><span style={{color:"#f43f5e",fontWeight:600}}>{fmtRM(amt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:240,overflowY:"auto"}}>
                    {monthTxns.map(t=>(
                      <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0f172a",borderRadius:8,padding:"8px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:5,height:5,borderRadius:"50%",background:t.type==="in"?"#10b981":"#f43f5e",flexShrink:0}}/>
                          <div><div style={{fontSize:12,color:"#e2e8f0"}}>{t.desc}</div><div style={{fontSize:10,color:"#475569"}}>{t.category} · {t.date}</div></div>
                        </div>
                        <div style={{fontSize:12,fontWeight:700,color:t.type==="in"?"#10b981":"#f43f5e"}}>{t.type==="in"?"+":"-"}{fmtRM(t.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>)}
          </div>
        )}

        {/* ── CASH TRACKER ── */}
        {tab==="cash"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>Cash Tracker</div><div style={{fontSize:12,color:"#475569"}}>Log daily income & expenses</div></div>
              <button onClick={()=>setShowTxnForm(v=>!v)} style={{background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:500}}>
                {showTxnForm?<X size={13}/>:<Plus size={13}/>}{showTxnForm?"Cancel":"Add Entry"}
              </button>
            </div>
            {showTxnForm&&(
              <div style={{background:"#111827",border:"1px solid #6366f133",borderRadius:12,padding:18,marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:10,color:"#64748b",marginBottom:4}}>TYPE</div>
                    <div style={{display:"flex",gap:6}}>
                      {["in","out"].map(t=>(
                        <button key={t} onClick={()=>setTxnForm(f=>({...f,type:t,category:t==="in"?"Salary":"Food"}))} style={{flex:1,padding:"7px",borderRadius:6,border:`1px solid ${txnForm.type===t?(t==="in"?"#10b981":"#f43f5e"):"#1e293b"}`,background:txnForm.type===t?(t==="in"?"#10b98122":"#f43f5e22"):"#0f172a",color:txnForm.type===t?(t==="in"?"#10b981":"#f43f5e"):"#64748b",cursor:"pointer",fontSize:12,fontWeight:600}}>
                          {t==="in"?"Cash In ↑":"Cash Out ↓"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>{sLabel("CATEGORY")}
                    <select value={txnForm.category} onChange={e=>setTxnForm(f=>({...f,category:e.target.value}))} style={{width:"100%",background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",color:"#e2e8f0",fontSize:13}}>
                      {(txnForm.type==="in"?IN_CATS:OUT_CATS).map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>{sLabel("DESCRIPTION")}<input {...inp(txnForm.desc,v=>setTxnForm(f=>({...f,desc:v})),{placeholder:"e.g. Lunch at mamak"})}/></div>
                  <div>{sLabel("AMOUNT (RM)")}<input type="number" {...inp(txnForm.amount,v=>setTxnForm(f=>({...f,amount:v})),{placeholder:"0.00"})}/></div>
                  <div>{sLabel("DATE")}<input type="date" {...inp(txnForm.date,v=>setTxnForm(f=>({...f,date:v})))}/></div>
                  <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={addTxn} style={{width:"100%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",border:"none",borderRadius:6,padding:"9px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600}}>Save Entry</button></div>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[{l:"Total In",v:totalIn,c:"#10b981"},{l:"Total Out",v:totalOut,c:"#f43f5e"},{l:"Net Balance",v:balance,c:"#6366f1"}].map((s,i)=>(
                <div key={i} style={{background:"#111827",border:`1px solid ${s.c}33`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:s.c,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>{fmtRM(s.v)}</div>
                </div>
              ))}
            </div>
            {card(<>
              <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",marginBottom:10}}>All Transactions ({transactions.length})</div>
              {!transactions.length?<div style={{textAlign:"center",color:"#334155",fontSize:12,padding:30}}>No entries yet</div>:(
                transactions.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 4px",borderBottom:"1px solid #0f172a"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:t.type==="in"?"#10b98122":"#f43f5e22",display:"flex",alignItems:"center",justifyContent:"center",color:t.type==="in"?"#10b981":"#f43f5e"}}>
                        {t.type==="in"?<TrendingUp size={14}/>:<TrendingDown size={14}/>}
                      </div>
                      <div><div style={{fontSize:12,fontWeight:500,color:"#e2e8f0"}}>{t.desc}</div>
                        <div style={{fontSize:10,color:"#475569",display:"flex",gap:8,marginTop:1}}>
                          <span><Tag size={9}/> {t.category}</span><span><Calendar size={9}/> {t.date}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{fontSize:13,fontWeight:700,color:t.type==="in"?"#10b981":"#f43f5e"}}>{t.type==="in"?"+":"-"}{fmtRM(t.amount)}</div>
                      <button onClick={()=>setTransactions(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#334155",padding:2}}><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))
              )}
            </>)}
          </div>
        )}

        {/* ── FD MANAGER ── */}
        {tab==="fd"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>FD Manager</div><div style={{fontSize:12,color:"#475569"}}>Track fixed deposit returns</div></div>
              <button onClick={()=>setShowFdForm(v=>!v)} style={{background:"linear-gradient(135deg,#22d3ee,#06b6d4)",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:500}}>
                {showFdForm?<X size={13}/>:<Plus size={13}/>}{showFdForm?"Cancel":"Add FD"}
              </button>
            </div>
            {showFdForm&&(
              <div style={{background:"#111827",border:"1px solid #22d3ee33",borderRadius:12,padding:18,marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[{l:"BANK / INSTITUTION",k:"bank",t:"text",ph:"e.g. Maybank"},{l:"PRINCIPAL (RM)",k:"principal",t:"number",ph:"10000"},{l:"INTEREST RATE (% p.a.)",k:"rate",t:"number",ph:"3.50"},{l:"TENURE (MONTHS)",k:"months",t:"number",ph:"12"},{l:"START DATE",k:"startDate",t:"date",ph:""}].map(f=>(
                    <div key={f.k}>{sLabel(f.l)}<input type={f.t} {...inp(fdForm[f.k],v=>setFdForm(p=>({...p,[f.k]:v})),{placeholder:f.ph})}/></div>
                  ))}
                  <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                    {fdForm.principal&&fdForm.rate&&fdForm.months&&(
                      <div style={{background:"#22d3ee11",border:"1px solid #22d3ee33",borderRadius:6,padding:"8px 10px",fontSize:12,marginBottom:8}}>
                        <div style={{color:"#64748b"}}>Preview Maturity</div>
                        <div style={{color:"#22d3ee",fontWeight:700,fontSize:15}}>{fmtRM(calcFD(fdForm.principal,fdForm.rate,fdForm.months))}</div>
                        <div style={{color:"#475569",fontSize:11}}>Interest: {fmtRM(calcFD(fdForm.principal,fdForm.rate,fdForm.months)-parseFloat(fdForm.principal))}</div>
                      </div>
                    )}
                    <button onClick={addFd} style={{background:"linear-gradient(135deg,#22d3ee,#06b6d4)",border:"none",borderRadius:6,padding:"9px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600}}>Save FD</button>
                  </div>
                </div>
              </div>
            )}
            {!fds.length?<div style={{background:"#111827",border:"1px solid #1e293b",borderRadius:12,padding:60,textAlign:"center",color:"#334155",fontSize:13}}>No FDs added yet</div>:(
              <div style={{display:"grid",gap:10}}>
                {fds.map(f=>{ const mat=calcFD(f.principal,f.rate,f.months); const int=mat-parseFloat(f.principal); return(
                  <div key={f.id} style={{background:"linear-gradient(135deg,#111827,#1e293b)",border:"1px solid #22d3ee22",borderRadius:12,padding:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#22d3ee",marginBottom:10}}>{f.bank||"FD Account"}</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                          {[{icon:<DollarSign size={11}/>,l:"Principal",v:fmtRM(f.principal)},{icon:<Percent size={11}/>,l:"Rate p.a.",v:`${f.rate}%`},{icon:<Clock size={11}/>,l:"Tenure",v:`${f.months} mo`},{icon:<Calendar size={11}/>,l:"Maturity",v:addMonths(f.startDate,f.months)}].map((d,i)=>(
                            <div key={i} style={{background:"#0f172a",borderRadius:8,padding:"9px 10px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:3,color:"#475569",fontSize:10,marginBottom:3}}>{d.icon}{d.l}</div>
                              <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{d.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",gap:10,marginTop:10}}>
                          <div style={{background:"#10b98111",border:"1px solid #10b98133",borderRadius:8,padding:"7px 14px"}}><div style={{fontSize:10,color:"#10b981"}}>Maturity Value</div><div style={{fontSize:15,fontWeight:700,color:"#10b981"}}>{fmtRM(mat)}</div></div>
                          <div style={{background:"#6366f111",border:"1px solid #6366f133",borderRadius:8,padding:"7px 14px"}}><div style={{fontSize:10,color:"#a78bfa"}}>Interest Earned</div><div style={{fontSize:15,fontWeight:700,color:"#a78bfa"}}>{fmtRM(int)}</div></div>
                        </div>
                      </div>
                      <button onClick={()=>setFds(p=>p.filter(x=>x.id!==f.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#334155",padding:4,marginLeft:10}}><Trash2 size={15}/></button>
                    </div>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* ── INVESTMENT ── */}
        {tab==="investment"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>Investment Portfolio</div><div style={{fontSize:12,color:"#475569"}}>Track stocks, ETFs, crypto & more</div></div>
              <button onClick={()=>setShowInvForm(v=>!v)} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontWeight:500}}>
                {showInvForm?<X size={13}/>:<Plus size={13}/>}{showInvForm?"Cancel":"Add Holding"}
              </button>
            </div>

            {showInvForm&&(
              <div style={{background:"#111827",border:"1px solid #f59e0b33",borderRadius:12,padding:18,marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>{sLabel("STOCK / FUND NAME")}<input {...inp(invForm.name,v=>setInvForm(f=>({...f,name:v})),{placeholder:"e.g. MAYBANK / NVDA"})}/></div>
                  <div>{sLabel("TYPE")}
                    <select value={invForm.type} onChange={e=>setInvForm(f=>({...f,type:e.target.value}))} style={{width:"100%",background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",color:"#e2e8f0",fontSize:13}}>
                      {INV_TYPES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>{sLabel("SECTOR")}
                    <select value={invForm.sector} onChange={e=>setInvForm(f=>({...f,sector:e.target.value}))} style={{width:"100%",background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",color:"#e2e8f0",fontSize:13}}>
                      {INV_SECTORS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>{sLabel("UNITS / SHARES")}<input type="number" {...inp(invForm.units,v=>setInvForm(f=>({...f,units:v})),{placeholder:"100"})}/></div>
                  <div>{sLabel("BUY PRICE (RM)")}<input type="number" {...inp(invForm.buyPrice,v=>setInvForm(f=>({...f,buyPrice:v})),{placeholder:"1.50"})}/></div>
                  <div>{sLabel("CURRENT PRICE (RM)")}<input type="number" {...inp(invForm.currentPrice,v=>setInvForm(f=>({...f,currentPrice:v})),{placeholder:"1.80"})}/></div>
                  <div>{sLabel("DATE BOUGHT")}<input type="date" {...inp(invForm.date,v=>setInvForm(f=>({...f,date:v})))}/></div>
                  <div style={{display:"flex",alignItems:"flex-end"}}>
                    {invForm.units&&invForm.buyPrice&&invForm.currentPrice&&(()=>{
                      const cost=invForm.units*invForm.buyPrice; const val=invForm.units*invForm.currentPrice; const pnl=val-cost; const pct=(pnl/cost*100).toFixed(1);
                      return <div style={{background:pnl>=0?"#10b98111":"#f43f5e11",border:`1px solid ${pnl>=0?"#10b98133":"#f43f5e33"}`,borderRadius:6,padding:"8px 10px",width:"100%",boxSizing:"border-box"}}>
                        <div style={{fontSize:10,color:"#64748b"}}>Preview P&L</div>
                        <div style={{fontSize:14,fontWeight:700,color:pnl>=0?"#10b981":"#f43f5e"}}>{fmtRM(pnl)} ({pct}%)</div>
                      </div>;
                    })()}
                  </div>
                </div>
                <button onClick={addInv} style={{marginTop:10,background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",borderRadius:6,padding:"9px 20px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:600}}>Save Holding</button>
              </div>
            )}

            {/* Summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
              {[{l:"Total Invested",v:fmtRM(totalInvCost),c:"#64748b"},{l:"Market Value",v:fmtRM(totalInvValue),c:"#22d3ee"},{l:"Total P&L",v:fmtRM(invPnL),c:invPnL>=0?"#10b981":"#f43f5e"},{l:"Return %",v:`${totalInvCost>0?((invPnL/totalInvCost)*100).toFixed(2):0}%`,c:invPnL>=0?"#10b981":"#f43f5e"}].map((s,i)=>(
                <div key={i} style={{background:"#111827",border:`1px solid ${s.c}33`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:s.c,marginBottom:4}}>{s.l}</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{s.v}</div>
                </div>
              ))}
            </div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              {card(<>
                <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:10}}>Sector Allocation</div>
                {sectorInvData.length>0?(
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart><Pie data={sectorInvData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {sectorInvData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie><Tooltip formatter={v=>fmtRM(v)} contentStyle={ttStyle}/></PieChart>
                  </ResponsiveContainer>
                ):<div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:12}}>No investments yet</div>}
              </>)}
              {card(<>
                <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:10}}>Holdings by Type</div>
                {investments.length>0?(()=>{
                  const m={}; investments.forEach(i=>{const v=parseFloat(i.currentPrice||0)*parseFloat(i.units||0); m[i.type]=(m[i.type]||0)+v;});
                  return <ResponsiveContainer width="100%" height={180}><BarChart data={Object.entries(m).map(([name,value])=>({name,value}))} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/><XAxis dataKey="name" tick={{fill:"#475569",fontSize:10}}/><YAxis tick={{fill:"#475569",fontSize:10}} tickFormatter={v=>`RM${v>=1000?(v/1000).toFixed(0)+"k":v}`}/>
                    <Tooltip formatter={v=>fmtRM(v)} contentStyle={ttStyle}/>
                    <Bar dataKey="value" fill="#f59e0b" radius={[4,4,0,0]}/>
                  </BarChart></ResponsiveContainer>;
                })():<div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:"#334155",fontSize:12}}>No investments yet</div>}
              </>)}
            </div>

            {/* Holdings table */}
            {card(<>
              <div style={{fontSize:12,fontWeight:600,color:"#94a3b8",marginBottom:10}}>All Holdings ({investments.length})</div>
              {!investments.length?<div style={{textAlign:"center",color:"#334155",fontSize:12,padding:30}}>No holdings added yet</div>:(
                investments.map(inv=>{
                  const cost=parseFloat(inv.buyPrice||0)*parseFloat(inv.units||0);
                  const val=parseFloat(inv.currentPrice||0)*parseFloat(inv.units||0);
                  const pnl=val-cost; const pct=cost>0?(pnl/cost*100).toFixed(1):0;
                  return(
                    <div key={inv.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 4px",borderBottom:"1px solid #0f172a"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:"#f59e0b22",display:"flex",alignItems:"center",justifyContent:"center",color:"#f59e0b",fontSize:13,fontWeight:700}}>{inv.name.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:"#e2e8f0"}}>{inv.name} <span style={{fontSize:10,color:"#475569",fontWeight:400}}>{inv.type}</span></div>
                          <div style={{fontSize:10,color:"#475569"}}>{inv.sector} · {inv.units} units @ RM{inv.buyPrice}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:16}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{fmtRM(val)}</div>
                          <div style={{fontSize:11,color:pnl>=0?"#10b981":"#f43f5e",display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}>
                            {pnl>=0?<ArrowUpRight size={11}/>:<ArrowDownRight size={11}/>}{pnl>=0?"+":""}{fmtRM(pnl)} ({pct}%)
                          </div>
                        </div>
                        <button onClick={()=>setInvestments(p=>p.filter(x=>x.id!==inv.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#334155",padding:2}}><Trash2 size={13}/></button>
                      </div>
                    </div>
                  );
                })
              )}
            </>)}

            {/* Sector Analysis */}
            <div style={{marginTop:14}}>
              <div style={{fontSize:14,fontWeight:700,color:"#f1f5f9",marginBottom:10}}>📊 Sector Analysis & Market Outlook</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {SECTOR_ANALYSIS.map((s,i)=>(
                  <div key={i} style={{background:"#111827",border:`1px solid ${s.color}33`,borderRadius:12,padding:16}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:20}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>{s.sector}</div>
                          <div style={{fontSize:10,color:"#475569"}}>Risk: {s.risk}</div>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:13,fontWeight:700,color:s.trend==="up"?"#10b981":s.trend==="down"?"#f43f5e":"#f59e0b"}}>
                          {s.trend==="up"?"↑":s.trend==="down"?"↓":"→"} {s.change>0?"+":""}{s.change}%
                        </div>
                        <div style={{fontSize:10,background:`${s.color}22`,color:s.color,padding:"1px 8px",borderRadius:4,marginTop:2}}>{s.rating}</div>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,lineHeight:1.5}}>{s.desc}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {s.picks.map(p=><span key={p} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:4,padding:"2px 8px",fontSize:10,color:"#64748b"}}>{p}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MARKET PULSE ── */}
        {tab==="news"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div><div style={{fontSize:16,fontWeight:700,color:"#f1f5f9"}}>Market Pulse 📡</div><div style={{fontSize:12,color:"#475569"}}>Financial news & market snapshot</div></div>
              <div style={{display:"flex",gap:4,background:"#111827",border:"1px solid #1e293b",borderRadius:8,padding:3}}>
                {["all","local","global"].map(f=>(
                  <button key={f} onClick={()=>setNewsFilter(f)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:500,background:newsFilter===f?"linear-gradient(135deg,#6366f1,#4f46e5)":"transparent",color:newsFilter===f?"#fff":"#64748b",textTransform:"capitalize"}}>
                    {f==="local"?"🇲🇾 MY":f==="global"?"🌐 Global":"All"}
                  </button>
                ))}
              </div>
            </div>

            {/* Market Snapshot Cards */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:"#64748b",marginBottom:8,letterSpacing:1}}>MARKET SNAPSHOT</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:8}}>
                {[
                  {label:"KLCI",value:"1,582.30",change:+0.42,flag:"🇲🇾"},
                  {label:"USD/MYR",value:"4.4720",change:-0.18,flag:"💱"},
                  {label:"S&P 500",value:"5,248.10",change:+0.29,flag:"🇺🇸"},
                  {label:"Gold (USD/oz)",value:"2,341.50",change:+0.81,flag:"🥇"},
                ].map((m,i)=>(
                  <div key={i} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#475569",marginBottom:4}}>{m.flag} {m.label}</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{m.value}</div>
                    <div style={{fontSize:11,color:m.change>=0?"#10b981":"#f43f5e",marginTop:2}}>{m.change>=0?"▲":"▼"} {Math.abs(m.change)}%</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[
                  {label:"Brent Crude",value:"USD 82.40",change:-0.55,flag:"🛢️"},
                  {label:"Bitcoin",value:"USD 67,210",change:+2.14,flag:"₿"},
                  {label:"Nikkei 225",value:"38,920.10",change:+0.67,flag:"🇯🇵"},
                  {label:"OPR (BNM)",value:"3.00%",change:0,flag:"🏦"},
                ].map((m,i)=>(
                  <div key={i} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#475569",marginBottom:4}}>{m.flag} {m.label}</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#f1f5f9"}}>{m.value}</div>
                    <div style={{fontSize:11,color:m.change>0?"#10b981":m.change<0?"#f43f5e":"#475569",marginTop:2}}>{m.change>0?"▲":m.change<0?"▼":"—"} {m.change===0?"Unchanged":`${Math.abs(m.change)}%`}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"#111827",border:"1px solid #f59e0b33",borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#f59e0b"}}>
              <Newspaper size={13}/>Placeholder news — real-time integration available on request.
            </div>

            <div style={{display:"grid",gap:8}}>
              {(newsFilter==="local"?NEWS.filter(n=>n.local):newsFilter==="global"?NEWS.filter(n=>!n.local):NEWS).map((n,i)=>(
                <div key={i} style={{background:"#111827",border:"1px solid #1e293b",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <div style={{width:36,height:36,borderRadius:8,background:n.local?"#22d3ee22":"#6366f122",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>{n.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:"#e2e8f0",marginBottom:3}}>{n.title}</div>
                    <div style={{fontSize:10,color:"#475569",display:"flex",gap:10,alignItems:"center"}}>
                      <span>{n.source}</span><span>·</span>
                      <span style={{display:"flex",alignItems:"center",gap:2}}><Clock size={9}/>{n.time}</span>
                      <span style={{background:n.local?"#22d3ee22":"#6366f122",color:n.local?"#22d3ee":"#a78bfa",padding:"1px 7px",borderRadius:4,fontSize:10}}>{n.tag}</span>
                    </div>
                  </div>
                  <ChevronRight size={13} color="#334155"/>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}