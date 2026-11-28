import { type ReactNode, useState } from 'react';
import { Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, StatusBadge } from '../ui';

export default function MapPlateDialog({ open, onClose, title, description, status, category, imageUrl, filename, plate, metadata, note }: {
    open:boolean; onClose:()=>void; title:string; description:string; status:string; category:string;
    imageUrl?:string; filename?:string; plate?:ReactNode; metadata:Array<[string, ReactNode]>; note?:string;
}) {
    const [zoomIndex,setZoomIndex]=useState(0);
    const [surface,setSurface]=useState<'night'|'paper'>('night');
    const zoom=[100,135,175,225][zoomIndex];
    return <Dialog open={open} onClose={()=>{setZoomIndex(0);onClose();}} size="xl" title={title} description={description} footer={<>
        <div className="mr-auto flex items-center gap-1.5"><button type="button" disabled={zoomIndex===0} onClick={()=>setZoomIndex(index=>Math.max(0,index-1))} aria-label="Zoom out map plate" className="municipal-secondary-button px-3 disabled:opacity-50"><ZoomOut size={15} aria-hidden="true" /></button><span className="min-w-12 text-center font-mono text-xs font-bold">{zoom}%</span><button type="button" disabled={zoomIndex===3} onClick={()=>setZoomIndex(index=>Math.min(3,index+1))} aria-label="Zoom in map plate" className="municipal-secondary-button px-3 disabled:opacity-50"><ZoomIn size={15} aria-hidden="true" /></button></div>
        <button type="button" onClick={()=>window.print()} className="municipal-secondary-button"><Printer size={15} aria-hidden="true" />Print Plate</button>
        {imageUrl ? <a href={imageUrl} download={filename} className="municipal-primary-button"><Download size={15} aria-hidden="true" />Download Image</a> : <button type="button" disabled className="municipal-secondary-button">Download image · unavailable</button>}
    </>}>
        <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2"><StatusBadge tone="neutral">{status}</StatusBadge><StatusBadge tone="info">{category}</StatusBadge></div><div role="group" aria-label="Plate viewing surface" className="flex gap-1 rounded-lg border border-[var(--border-default)] p-1">{(['night','paper'] as const).map(value=><button key={value} type="button" aria-pressed={surface===value} onClick={()=>setSurface(value)} className={`min-h-11 rounded-md px-3 text-xs font-semibold ${surface===value?'bg-[var(--brand-primary)] text-white':'text-[var(--ink-secondary)]'}`}>{value==='night'?'Night Mat':'Paper Print'}</button>)}</div></div>
            <div tabIndex={0} role="region" aria-label={`Scrollable map preview for ${title}`} className={`max-h-[58dvh] overflow-auto rounded-xl border border-[var(--border-default)] p-3 ${surface==='paper'?'tcds-paper-surface':'bg-[var(--surface-recessed)]'}`}><div style={{width:`${zoom}%`}}>{imageUrl ? <img src={imageUrl} alt={`${title} cartographic reference plate`} className={`block w-full rounded-lg ${surface==='paper'?'bg-white':'tcds-plate-thumb'}`} /> : plate}</div></div>
            {note && <p role="note" className="text-sm leading-6 text-[var(--ink-secondary)]">{note}</p>}
            <dl className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 text-xs sm:grid-cols-2">{metadata.map(([label,value])=><div key={label} className="min-w-0"><dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">{label}</dt><dd className="mt-1 break-words leading-5 text-[var(--ink-primary)]">{value}</dd></div>)}</dl>
        </div>
    </Dialog>;
}
