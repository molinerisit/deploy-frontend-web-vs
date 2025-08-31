// src/components/ui/DataTable.jsx
export default function DataTable({ columns = [], rows = [] }) {
  return (
    <div className="table-wrap">
      <div className="table">
        <div className="thead">
          {columns.map(c => <div key={c.key || c.header}>{c.header}</div>)}
        </div>
        {rows.length ? rows.map((r, i) => (
          <div className="tr" key={i}>
            {columns.map(c => <div key={c.key || c.header}>{c.render ? c.render(r) : r[c.key]}</div>)}
          </div>
        )) : (
          <div className="empty">Sin registros</div>
        )}
      </div>
    </div>
  );
}
