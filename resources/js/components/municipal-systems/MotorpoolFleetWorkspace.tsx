import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Fuel, Route, Truck, Wrench } from 'lucide-react';
import {
    fleetSummary, fleetTrips, fleetVehicles, maintenanceAttentionVehicles, readinessCounts, recentTrips, todayTrips, upcomingTrips,
    type FleetReadiness, type FleetTrip, type FleetVehicle, type MaintenanceState, type TripState,
} from '../../data/municipal/motorpoolFleetData';
import DetailDrawer from './DetailDrawer';

type Props = { onBack: () => void };
type Tab = 'Overview' | 'Fleet Board' | 'Trip Schedule' | 'Maintenance & Fuel';
type Step = 'vehicle' | 'trips' | 'maintenance';
const tabs: Tab[] = ['Overview', 'Fleet Board', 'Trip Schedule', 'Maintenance & Fuel'];
const steps: Array<{ id: Step; label: string }> = [{ id: 'vehicle', label: 'Vehicle' }, { id: 'trips', label: 'Trips' }, { id: 'maintenance', label: 'Maintenance' }];
const surface = 'rounded-xl border border-slate-200 bg-[var(--surface-card)] dark:border-slate-700 dark:bg-[#142236]';

const readinessTone: Record<FleetReadiness, string> = {
    Available: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Scheduled: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
    'In service reference': 'border-indigo-200 bg-indigo-50 text-indigo-800',
    'Maintenance attention': 'border-amber-200 bg-amber-50 text-amber-800',
};
const readinessBar: Record<FleetReadiness, string> = { Available: 'bg-emerald-500', Scheduled: 'bg-blue-500', 'In service reference': 'bg-indigo-500', 'Maintenance attention': 'bg-amber-500' };
const tripTone: Record<TripState, string> = {
    'Scheduled reference': 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300', 'In service reference': 'border-indigo-200 bg-indigo-50 text-indigo-800',
    'Completed reference': 'border-emerald-200 bg-emerald-50 text-emerald-800', 'Awaiting vehicle reference': 'border-amber-200 bg-amber-50 text-amber-800',
};
const maintenanceTone: Record<MaintenanceState, string> = {
    'Current reference': 'text-emerald-700 dark:text-emerald-300', 'Inspection attention': 'text-amber-800 dark:text-amber-300', 'Service attention': 'text-rose-700 dark:text-rose-300', 'Maintenance reference': 'text-blue-700 dark:text-blue-300',
};

function Header({ onBack }: Props) {
    const signals = [
        ['Fleet in view', fleetSummary.fleetInView, 'text-slate-900 dark:text-slate-100'], ['Available', fleetSummary.available, 'text-emerald-700 dark:text-emerald-300'],
        ['Scheduled', fleetSummary.scheduled, 'text-blue-700 dark:text-blue-300'], ['Maintenance attention', fleetSummary.maintenanceAttention, 'text-amber-800 dark:text-amber-300'],
    ] as const;
    return <header className={`${surface} px-3 py-3 sm:px-4`}><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(410px,520px)] lg:items-center">
        <div className="min-w-0"><div className="flex items-center gap-2"><button type="button" onClick={onBack} aria-label="Back to Future Integrations" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-[var(--ink-secondary)] dark:border-slate-700"><ArrowLeft size={14}/></button><span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-blue-700 dark:text-blue-300">Fleet operations</span></div>
        <h1 className="mt-1.5 text-[22px] font-extrabold text-slate-950 dark:text-slate-100">Motorpool / Fleet Management</h1>
        <p className="mt-1 text-[10px] font-semibold text-[var(--ink-secondary)]"><b className="text-slate-700 dark:text-slate-200">General Services / Motorpool</b> · Vehicle scheduling, readiness, maintenance and trip references</p>
        <p className="mt-1 text-[9px] text-[var(--ink-secondary)]">Presentation environment · illustrative fleet references only · dispatch actions disabled</p></div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">{signals.map(([label,value,tone]) => <div key={label} className="rounded-lg border border-slate-200 bg-[var(--surface-recessed)] px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/35"><div className={`text-[17px] font-extrabold tabular-nums ${tone}`}>{value}</div><div className="mt-1 text-[8px] font-extrabold uppercase tracking-[.06em] text-[var(--ink-secondary)]">{label}</div></div>)}</div>
    </div></header>;
}

function ReadinessRail() {
    return <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">{readinessCounts.map(x => <div key={x.readiness} className={`${surface} overflow-hidden`}><div className={`h-1 ${readinessBar[x.readiness]}`}/><div className="flex items-center justify-between px-3 py-2.5"><span className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{x.readiness}</span><b className="text-[17px] tabular-nums text-slate-950 dark:text-slate-100">{x.count}</b></div></div>)}</div>;
}

function FleetBoard({ onOpen, compact=false }: { onOpen:(v:FleetVehicle)=>void; compact?:boolean }) {
    return <section className={`${surface} overflow-hidden`}><div className="flex items-end justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-700"><div><h2 className="flex items-center gap-2 text-[11px] font-extrabold"><Truck size={14} className="text-blue-600"/>Fleet Board</h2><p className="text-[9px] text-[var(--ink-secondary)]">Readiness, trip context and maintenance attention by vehicle reference.</p></div><span className="text-[9px] text-[var(--ink-secondary)]">{fleetVehicles.length} vehicles</span></div>
        <div className={compact?'max-h-[405px] overflow-y-auto':''}><div className="hidden grid-cols-[115px_1fr_1.1fr_145px_1fr_155px] bg-[var(--surface-recessed)] px-3 py-2 text-[8px] font-extrabold uppercase text-[var(--ink-secondary)] lg:grid"><span>Vehicle ref</span><span>Type</span><span>Assigned office / use</span><span>Readiness</span><span>Trip status</span><span>Maintenance</span></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">{fleetVehicles.map(v => <button key={v.id} type="button" onClick={()=>onOpen(v)} className="grid w-full gap-2 px-3 py-2.5 text-left hover:bg-blue-50/20 dark:hover:bg-blue-950/35 lg:grid-cols-[115px_1fr_1.1fr_145px_1fr_155px] lg:items-center"><b className="text-[9px] text-[var(--ink-secondary)]">{v.id}</b><div><div className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{v.type}</div><div className="text-[8px] text-[var(--ink-secondary)]">{v.useContext}</div></div><span className="text-[9px] text-[var(--ink-secondary)] dark:text-slate-300">{v.office}</span><span className={`w-fit rounded-full border px-2 py-1 text-[8px] font-bold ${readinessTone[v.readiness]}`}>{v.readiness}</span><span className="text-[9px] text-[var(--ink-secondary)] dark:text-slate-300">{v.tripStatus}</span><span className={`text-[9px] font-bold ${maintenanceTone[v.maintenanceState]}`}>{v.maintenanceState}</span></button>)}</div></div>
    </section>;
}

function TripCard({ trip }: { trip:FleetTrip }) {
    return <article className="rounded-lg border border-slate-200 bg-[var(--surface-card)] p-2.5 dark:border-slate-700 dark:bg-[#142236]"><div className="flex justify-between gap-2"><div><b className="text-[9px] text-blue-700 dark:text-blue-300">{trip.id}</b><div className="text-[10px] font-bold text-slate-900 dark:text-slate-100">{trip.vehicleLabel}</div></div><span className={`h-fit rounded-full border px-2 py-1 text-[8px] font-bold ${tripTone[trip.state]}`}>{trip.state}</span></div><div className="mt-2 space-y-1 text-[9px] text-[var(--ink-secondary)]"><p className="flex gap-1.5"><Route size={11}/>{trip.destinationContext}</p><p className="flex gap-1.5"><CalendarClock size={11}/>{trip.schedule}</p><p>{trip.requestingOffice}</p></div></article>;
}

function Overview({ onOpen }: { onOpen:(v:FleetVehicle)=>void }) {
    return <div className="space-y-2.5"><ReadinessRail/><div className="grid items-start gap-2.5 xl:grid-cols-[minmax(0,2.45fr)_minmax(280px,.9fr)]"><FleetBoard onOpen={onOpen} compact/><div className="space-y-2.5">
        <section className={`${surface} bg-[var(--surface-recessed)]/55 p-3 dark:bg-slate-900/25`}><h2 className="text-[11px] font-extrabold">Today / upcoming trip schedule</h2><p className="text-[9px] text-[var(--ink-secondary)]">Dispatch-planning references only; no ticket issuance.</p><div className="mt-2 space-y-2">{[...todayTrips.slice(0,2),...upcomingTrips.slice(0,1)].map(t=><TripCard key={t.id} trip={t}/>)}</div></section>
        <section className={`${surface} p-3`}><h2 className="flex items-center gap-2 text-[11px] font-extrabold"><Wrench size={14} className="text-amber-600"/>Maintenance attention</h2><div className="mt-2 space-y-1.5">{maintenanceAttentionVehicles.map(v=><button key={v.id} type="button" onClick={()=>onOpen(v)} className="w-full rounded-lg border border-amber-100 bg-[var(--status-warn-bg)] px-2.5 py-2 text-left"><div className="flex justify-between"><b className="text-[9px] text-[var(--ink-secondary)]">{v.id}</b><span className={`text-[8px] font-bold ${maintenanceTone[v.maintenanceState]}`}>{v.maintenanceState}</span></div><div className="text-[9px] font-bold">{v.type}</div><div className="text-[8px] text-[var(--ink-secondary)]">{v.nextAttention}</div></button>)}</div></section>
        <section className={`${surface} p-3`}><h2 className="text-[11px] font-extrabold">Recent trip / fuel references</h2><div className="mt-2 divide-y divide-slate-100">{recentTrips.map(t=><div key={t.id} className="py-2 text-[9px]"><b className="text-blue-700 dark:text-blue-300">{t.id}</b><p className="text-[var(--ink-secondary)]">{t.vehicleLabel} · {t.destinationContext}</p></div>)}{fleetVehicles.filter(v=>v.fuelReferenceState!=='Reference current').slice(0,2).map(v=><div key={v.id} className="py-2 text-[9px]"><b className="text-amber-800 dark:text-amber-300">{v.fuelReferenceState}</b><p className="text-[var(--ink-secondary)]">{v.id} · {v.fuelReference}</p></div>)}</div></section>
    </div></div></div>;
}

function FleetBoardView({ onOpen }: { onOpen:(v:FleetVehicle)=>void }) {
    const groups=useMemo(()=>readinessCounts.map(g=>({...g,vehicles:fleetVehicles.filter(v=>v.readiness===g.readiness)})),[]);
    return <div className="space-y-2.5"><section className="grid gap-2.5 xl:grid-cols-4">{groups.map(g=><div key={g.readiness} className={`${surface} overflow-hidden`}><div className={`h-1 ${readinessBar[g.readiness]}`}/><div className="flex justify-between border-b border-slate-100 px-3 py-2.5"><b className="text-[10px]">{g.readiness}</b><b className="tabular-nums text-[var(--ink-secondary)]">{g.count}</b></div><div className="divide-y divide-slate-100">{g.vehicles.map(v=><button key={v.id} type="button" onClick={()=>onOpen(v)} className="w-full px-3 py-3 text-left hover:bg-[var(--surface-recessed)]"><span className="text-[8px] font-bold text-[var(--ink-secondary)]">{v.id}</span><div className="text-[10px] font-bold">{v.type}</div><div className="text-[8px] text-[var(--ink-secondary)]">{v.office}</div><div className="mt-1 text-[8px] text-[var(--ink-secondary)]">{v.tripStatus}</div></button>)}</div></div>)}</section><FleetBoard onOpen={onOpen}/></div>;
}

function TripScheduleView() {
    return <div className="grid gap-2.5 xl:grid-cols-2"><section className={`${surface} p-3`}><h2 className="text-[12px] font-extrabold">Today reference schedule</h2><p className="text-[9px] text-[var(--ink-secondary)]">Illustrative dispatch sequence without ticket or driver assignment.</p><div className="mt-3 space-y-2">{todayTrips.map(t=><TripCard key={t.id} trip={t}/>)}</div></section><section className={`${surface} p-3`}><h2 className="text-[12px] font-extrabold">Upcoming reference schedule</h2><p className="text-[9px] text-[var(--ink-secondary)]">Generic municipal destination/context references only.</p><div className="mt-3 space-y-2">{upcomingTrips.map(t=><TripCard key={t.id} trip={t}/>)}</div></section></div>;
}

function MaintenanceFuel({ onOpen }: { onOpen:(v:FleetVehicle)=>void }) {
    return <section className={`${surface} overflow-hidden`}><div className="flex justify-between border-b border-slate-100 px-3 py-2.5"><div><h2 className="text-[12px] font-extrabold">Maintenance &amp; fuel reference board</h2><p className="text-[9px] text-[var(--ink-secondary)]">No work order, authorization, fuel ledger or consumption claim.</p></div><div className="flex gap-2 text-[var(--ink-secondary)]"><Wrench size={16}/><Fuel size={16}/></div></div><div className="divide-y divide-slate-100">{fleetVehicles.map(v=><button key={v.id} type="button" onClick={()=>onOpen(v)} className="grid w-full gap-2 px-3 py-3 text-left hover:bg-blue-50/20 dark:hover:bg-blue-950/35 lg:grid-cols-[120px_160px_1fr_1fr_1fr_160px] lg:items-center"><div><b className="text-[9px] text-[var(--ink-secondary)]">{v.id}</b><div className="text-[9px] font-bold">{v.type}</div></div><span className={`text-[9px] font-bold ${maintenanceTone[v.maintenanceState]}`}>{v.maintenanceState}</span><span className="text-[9px] text-[var(--ink-secondary)]">{v.maintenanceReference}</span><span className="text-[9px] text-[var(--ink-secondary)]">{v.lastServiceContext}</span><span className="text-[9px] text-[var(--ink-secondary)]">{v.nextAttention}</span><span className="text-[9px] font-bold text-blue-700 dark:text-blue-300">{v.fuelReferenceState}</span></button>)}</div></section>;
}

function VehicleDetail({ vehicle,onClose }: { vehicle:FleetVehicle|null; onClose:()=>void }) {
    const [step,setStep]=useState<Step>('vehicle'); useEffect(()=>{if(vehicle)setStep('vehicle')},[vehicle?.id]);
    const index=steps.findIndex(s=>s.id===step); const trips=vehicle?fleetTrips.filter(t=>t.vehicleId===vehicle.id):[];
    return <DetailDrawer open={Boolean(vehicle)} onClose={onClose} size="standard" eyebrow="Fleet operations reference" title={vehicle?`${vehicle.id} · ${vehicle.type}`:'Fleet vehicle reference'} footer={vehicle?<div className="flex items-center justify-between"><span className="text-[9px] text-[var(--ink-secondary)]">Step {index+1} of 3 · presentation only</span><div className="flex gap-2">{index>0&&<button onClick={()=>setStep(steps[index-1].id)} className="rounded-lg border px-3 py-2 text-[10px] font-bold"><ChevronLeft size={12} className="inline"/> Back</button>}<button onClick={onClose} className="rounded-lg border px-3 py-2 text-[10px] font-bold">Close</button>{index<2&&<button onClick={()=>setStep(steps[index+1].id)} className="rounded-lg bg-[#0b2852] px-3 py-2 text-[10px] font-bold text-white">Next <ChevronRight size={12} className="inline"/></button>}</div></div>:undefined}>
        {vehicle&&<div className="space-y-4"><div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-recessed)] p-1">{steps.map(s=><button key={s.id} onClick={()=>setStep(s.id)} className={`min-h-9 rounded-lg text-[10px] font-bold ${step===s.id?'bg-[var(--surface-card)] text-blue-800 dark:text-blue-300 shadow-sm':'text-[var(--ink-secondary)]'}`}>{s.label}</button>)}</div>
        {step==='vehicle'&&<dl className="grid gap-3 text-[11px] sm:grid-cols-2"><div className="rounded-lg bg-[var(--surface-recessed)] p-3"><dt className="text-[var(--ink-secondary)]">Vehicle reference</dt><dd className="font-extrabold">{vehicle.id}</dd></div><div className="rounded-lg bg-[var(--surface-recessed)] p-3"><dt className="text-[var(--ink-secondary)]">Readiness</dt><dd className="font-bold">{vehicle.readiness}</dd></div><div className="rounded-lg border p-3 sm:col-span-2"><dt className="text-[var(--ink-secondary)]">Assigned office / use</dt><dd className="font-semibold">{vehicle.office} · {vehicle.useContext}</dd></div><div className="rounded-lg border p-3"><dt className="text-[var(--ink-secondary)]">Trip status</dt><dd>{vehicle.tripStatus}</dd></div><div className="rounded-lg border p-3"><dt className="text-[var(--ink-secondary)]">Recent movement</dt><dd>{vehicle.recentMovement}</dd></div></dl>}
        {step==='trips'&&<div className="space-y-2">{trips.length?trips.map(t=><TripCard key={t.id} trip={t}/>):<div className="rounded-lg border border-dashed p-5 text-center text-[10px] text-[var(--ink-secondary)]">No linked illustrative trip reference.</div>}</div>}
        {step==='maintenance'&&<div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border p-3"><h3 className="text-[9px] font-extrabold uppercase text-[var(--ink-secondary)]">Maintenance</h3><b className={`mt-2 block text-[11px] ${maintenanceTone[vehicle.maintenanceState]}`}>{vehicle.maintenanceState}</b><p className="text-[9px] text-[var(--ink-secondary)]">{vehicle.maintenanceReference}</p><p className="mt-2 text-[9px] text-[var(--ink-secondary)]">Next: {vehicle.nextAttention}</p></div><div className="rounded-lg border p-3"><h3 className="text-[9px] font-extrabold uppercase text-[var(--ink-secondary)]">Fuel reference</h3><b className="mt-2 block text-[11px] text-blue-700 dark:text-blue-300">{vehicle.fuelReferenceState}</b><p className="text-[9px] text-[var(--ink-secondary)]">{vehicle.fuelReference}</p><p className="mt-2 text-[8px] text-[var(--ink-secondary)]">No fuel ledger, transaction or consumption claim.</p></div></div><div className="rounded-lg bg-[var(--surface-recessed)] p-3"><h3 className="text-[9px] font-extrabold uppercase text-[var(--ink-secondary)]">Reference history</h3>{vehicle.history.map(e=><div key={e.label} className="mt-2"><b className="text-[10px]">{e.label}</b><p className="text-[9px] text-[var(--ink-secondary)]">{e.detail}</p></div>)}</div></div>}</div>}
    </DetailDrawer>;
}

export default function MotorpoolFleetWorkspace({ onBack }: Props) {
    const [tab,setTab]=useState<Tab>('Overview'); const [selected,setSelected]=useState<FleetVehicle|null>(null);
    return <div className="space-y-2.5"><Header onBack={onBack}/><div role="tablist" aria-label="Fleet reference views" className={`${surface} grid gap-1 p-1 sm:grid-cols-2 xl:grid-cols-4`}>{tabs.map(t=><button key={t} role="tab" aria-selected={tab===t} onClick={()=>setTab(t)} className={`min-h-10 rounded-lg px-3 text-left text-[10px] font-bold ${tab===t?'bg-blue-50 text-blue-900':'text-[var(--ink-secondary)] hover:bg-[var(--surface-recessed)]'}`}>{t}</button>)}</div>
        {tab==='Overview'&&<Overview onOpen={setSelected}/>} {tab==='Fleet Board'&&<FleetBoardView onOpen={setSelected}/>} {tab==='Trip Schedule'&&<TripScheduleView/>} {tab==='Maintenance & Fuel'&&<MaintenanceFuel onOpen={setSelected}/>}<div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[8px] text-[var(--ink-secondary)]">Presentation/reference only. No live dispatch, real trip ticket, fuel transaction, maintenance work order, GPS tracking, driver identity or operational vehicle record.</div><VehicleDetail vehicle={selected} onClose={()=>setSelected(null)}/>
    </div>;
}
