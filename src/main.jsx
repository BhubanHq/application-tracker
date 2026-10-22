import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { statuses, isDue } from '../shared/application.js';
import './style.css';
const empty = { company:'', role:'', status:'Saved', url:'', followUp:'', notes:'' };
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'});
async function api(path='', options={}) {
  const response = await fetch(`/api/applications${path}`, {...options, headers:{'Content-Type':'application/json'}});
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Cannot reach the API. Check that the server and MongoDB are running.'); }
  return response.status === 204 ? null : response.json();
}
function App() {
  const [items,setItems] = useState([]), [loading,setLoading] = useState(true), [error,setError] = useState('');
  const [query,setQuery] = useState(''), [status,setStatus] = useState('All'), [dueOnly,setDueOnly] = useState(false);
  const [editing,setEditing] = useState(null), [form,setForm] = useState(empty), [saving,setSaving] = useState(false), [formError,setFormError] = useState(''), [notice,setNotice] = useState('');
  const [today,setToday] = useState(dateKey());
  const dialog = useRef(null);
  async function load() { setLoading(true); setError(''); try { setItems(await api()); } catch(e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { load(); const timer = setInterval(() => setToday(dateKey()),60000); return () => clearInterval(timer); },[]);
  const due = items.filter(item => isDue(item,today));
  const visible = items.filter(item => (status === 'All' || item.status === status) && (!dueOnly || isDue(item,today)) && `${item.company} ${item.role} ${item.notes}`.toLowerCase().includes(query.toLowerCase()));
  function open(item) { setEditing(item?._id || null); setForm(item ? {...empty,...item} : {...empty}); setFormError(''); dialog.current.showModal(); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setFormError('');
    try { const saved = await api(editing ? `/${editing}` : '', {method:editing ? 'PUT':'POST',body:JSON.stringify(form)}); setItems(old => [saved,...old.filter(item => item._id !== saved._id)]); dialog.current.close(); setNotice(editing ? 'Application updated.':'Application added.'); }
    catch(e) { setFormError(e.message); } finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete the ${item.role} application at ${item.company}?`)) return;
    setError('');
    try { await api(`/${item._id}`,{method:'DELETE'}); setItems(old => old.filter(row => row._id !== item._id)); setNotice('Application deleted.'); } catch(e) { setError(e.message); }
  }
  return <div className="shell">
    <header><a className="brand" href="/" aria-label="NextStep home"><span className="logo">↗</span> NextStep<span className="brand-sub">APPLICATION TRACKER</span></a><span className="personal">Your personal workspace</span></header>
    <main><div className="heading"><div><p className="eyebrow">A LITTLE PROGRESS, EVERY DAY</p><h1>Your next chapter starts here.</h1><p className="subtitle">Keep your opportunities organized and your next move in sight.</p></div><button className="primary" onClick={() => open()}>＋ Add application</button></div>
    <section className="stats" aria-label="Application overview">{[['Total applications',items.length,'Every possibility'],['In progress',items.filter(i => ['Applied','Interview'].includes(i.status)).length,'Keep the momentum'],['Offers received',items.filter(i => i.status === 'Offer').length,'Something to celebrate'],['Follow-ups due',due.length,'Today and overdue']].map(([label,count,hint]) => <div className="stat" key={label}><span>{label}</span><strong>{loading ? '—':count}</strong><small>{hint}</small></div>)}</section>
    <section className="board"><div className="board-title"><div><h2>All opportunities</h2><p>Small steps toward your next big thing.</p></div><span className="count">{visible.length} {visible.length === 1 ? 'application' : 'applications'}</span></div>
    <div className="filters"><label className="search"><span>⌕</span><input aria-label="Search applications" placeholder="Search company, role, or notes…" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option>All</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><label className="due-toggle"><input type="checkbox" checked={dueOnly} onChange={e => setDueOnly(e.target.checked)}/> Follow-ups due</label></div>
    {error && <div className="error" role="alert">{error} <button onClick={load}>Retry</button></div>}<p className="sr-only" role="status">{notice}</p>
    {loading ? <div className="empty">Loading your opportunities…</div> : !visible.length ? <div className="empty"><span className="empty-icon">↗</span><h3>{items.length ? 'No matching opportunities':'Make room for your next opportunity'}</h3><p>{items.length ? 'Try another search or clear your filters.':'Add a role you have your eye on. We’ll help you keep track of the rest.'}</p>{!items.length && <button className="primary" onClick={() => open()}>Add your first application</button>}</div> : <div className="table-wrap"><table><thead><tr><th>Company / role</th><th>Status</th><th>Follow-up</th><th>Notes</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(item => <tr key={item._id}><td><div className="company-cell"><span className="avatar">{item.company.slice(0,2).toUpperCase()}</span><div><strong>{item.company}</strong><span>{item.role}</span>{item.url && <a href={item.url} target="_blank" rel="noreferrer">View opportunity ↗</a>}</div></div></td><td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td><td><span className={isDue(item,today) ? 'overdue':''}>{item.followUp ? formatDate(item.followUp):'—'}</span>{isDue(item,today) && <small className="due-label">{item.followUp === today ? 'Today':'Overdue'}</small>}</td><td className="notes">{item.notes || '—'}</td><td><div className="actions"><button onClick={() => open(item)} aria-label={`Edit ${item.company} application`}>Edit</button><button className="delete" onClick={() => remove(item)} aria-label={`Delete ${item.company} application`}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </section><footer>One place for every possibility.<span>Built for your next step.</span></footer></main>
    <dialog ref={dialog} aria-labelledby="form-title" onCancel={e => saving && e.preventDefault()}><form onSubmit={save}><div className="dialog-title"><div><p className="eyebrow">YOUR NEXT STEP</p><h2 id="form-title">{editing ? 'Edit application':'Add an opportunity'}</h2></div><button type="button" aria-label="Close form" disabled={saving} onClick={() => dialog.current.close()}>✕</button></div><div className="form-grid">{[['company','Company',120],['role','Role',160]].map(([key,label,max]) => <label key={key}>{label} *<input autoFocus={key === 'company'} required maxLength={max} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}/></label>)}<label>Status<select value={form.status} onChange={e => setForm({...form,status:e.target.value})}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><label>Follow-up date<input type="date" value={form.followUp} onChange={e => setForm({...form,followUp:e.target.value})}/></label><label className="full">Opportunity link<input type="url" placeholder="https://…" maxLength={2000} value={form.url} onChange={e => setForm({...form,url:e.target.value})}/></label><label className="full">Notes<textarea rows="4" maxLength={5000} placeholder="Contacts, interview details, or things to remember…" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}/></label></div>{formError && <p role="alert" className="error">{formError}</p>}<div className="form-actions"><button type="button" disabled={saving} onClick={() => dialog.current.close()}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…':'Save application'}</button></div></form></dialog>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
