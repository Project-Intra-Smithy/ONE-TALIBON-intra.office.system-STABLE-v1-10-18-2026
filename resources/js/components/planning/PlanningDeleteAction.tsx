import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui';
export default function PlanningDeleteAction({title,onDelete,disabledReason,busy=false}:{title:string;onDelete:()=>void;disabledReason?:string;busy?:boolean}) {
    const [confirming,setConfirming]=useState(false);
    return <>
        <button type="button" disabled={Boolean(disabledReason)||busy} title={disabledReason} onClick={()=>setConfirming(true)} aria-label={`Delete ${title}`} className="municipal-secondary-button text-[var(--status-danger-fg)] disabled:opacity-50"><Trash2 size={14} aria-hidden="true" />Delete</button>
        {disabledReason&&<span className="text-xs text-[var(--ink-secondary)]">{disabledReason}</span>}
        <ConfirmDialog open={confirming} title={`Delete ${title}?`} message="This removes the draft record from the server. This action cannot be undone." confirmLabel="Delete record" destructive onCancel={()=>setConfirming(false)} onConfirm={()=>{setConfirming(false);onDelete();}} />
    </>;
}
