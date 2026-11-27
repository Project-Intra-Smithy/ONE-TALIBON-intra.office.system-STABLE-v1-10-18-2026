import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';

type Row = {publicId:string;title:string;parentType:'plan'|'ppa'|'map';parentCode:string;parentRecordId:number|null;parentExists:boolean;archived:boolean;previewUrl:string|null;canReconcile:boolean};
type Parent = {id:number;code:string;title:string};
export default function Index({records,parents,canReconcile}:{records:{data:Row[];prev_page_url:string|null;next_page_url:string|null};parents:Record<Row['parentType'],Parent[]>;canReconcile:boolean}) {
    const [selected,setSelected]=useState<Row|null>(null);
    const [parentId,setParentId]=useState('');
    const [evidence,setEvidence]=useState('');
    const [error,setError]=useState('');
    const [busy,setBusy]=useState(false);
    return <AppLayout title="Planning document custody"><PageFrame>
        <h1 className="text-xl font-bold">Planning document custody</h1>
        <p>Retained documents remain discoverable even when the original parent is missing. Historical references are preserved. A binding requires a verified source record and an evidence reference; it cannot be reassigned here.</p>
        <Link href="/development-plans" className="municipal-secondary-button">Development Plans</Link>
        <ul className="space-y-3">{records.data.map(row=><li key={row.publicId} className="municipal-panel p-4">
            <h2 className="font-semibold">{row.title}</h2><p>{row.parentType}: {row.parentCode} · {row.archived?'Archived retained record':row.parentExists?'Parent verified':'Parent reconciliation required'}</p>
            {row.parentRecordId!==null&&!row.parentExists&&<p>The original bound record is missing. Request recovery of that record; this document cannot be reassigned.</p>}
            {row.previewUrl&&<a className="municipal-secondary-button" href={row.previewUrl} target="_blank" rel="noopener noreferrer">Preview document</a>}
            {row.parentRecordId===null&&!row.canReconcile&&<p>Historical custody requires originating-office review. Foreign or unknown custody remains held; internal read access is preserved.</p>}
            {canReconcile&&row.canReconcile&&<button className="municipal-secondary-button" onClick={()=>{setSelected(row);setParentId('');setEvidence('');setError('');}}>Reconcile {row.title}</button>}
            {selected?.publicId===row.publicId&&<form className="mt-3 space-y-3" onSubmit={event=>{event.preventDefault();if(busy)return;setBusy(true);setError('');router.post(`/planning/attachment-custody/${row.publicId}/reconcile`,{parent_record_id:Number(parentId),evidence_reference:evidence},{preserveScroll:true,onSuccess:()=>setSelected(null),onError:errors=>setError(Object.values(errors).join(' ')),onFinish:()=>setBusy(false)});}}>
                <label className="block">Verified parent<select required className="tcds-input" value={parentId} onChange={e=>setParentId(e.target.value)}><option value="">Select a verified record</option>{(parents[row.parentType]??[]).map(p=><option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}</select></label>
                <label className="block">Evidence reference and reconciliation reason<textarea required minLength={10} maxLength={4000} className="tcds-input" value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
                {error&&<p role="alert">{error}</p>}<button disabled={busy} className="municipal-primary-button">Record parent binding</button> <button type="button" className="municipal-secondary-button" onClick={()=>setSelected(null)}>Cancel</button>
            </form>}
        </li>)}</ul>
        <nav aria-label="Custody pages" className="flex gap-3">{records.prev_page_url&&<Link href={records.prev_page_url}>Previous</Link>}{records.next_page_url&&<Link href={records.next_page_url}>Next</Link>}</nav>
    </PageFrame></AppLayout>;
}
