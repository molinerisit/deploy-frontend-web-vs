import { money } from "../utils/format";

export default function PlanCard({ name, tag, price, features, cta, onAction, highlight=false }){
  return (
    <div className="card" style={{ padding:20, position:'relative', outline: highlight? '2px solid var(--primary)':'none' }}>
      {tag && <div className="badge" style={{ position:'absolute', top:12, right:12 }}>{tag}</div>}
      <h3 style={{marginTop:0}}>{name}</h3>
      <div className="price">{money(price)}</div>
      <div className="small" style={{marginBottom:14}}>por mes</div>
      <ul className="list">
        {features.map(f => <li key={f}>{f}</li>)}
      </ul>
      <div style={{marginTop:14}}>
        <button className={`btn ${highlight ? 'primary':''}`} onClick={onAction}>{cta}</button>
      </div>
    </div>
  );
}
