import { type ChangeEvent, type FormEvent, type ReactNode, useState } from 'react';
import { Image as ImageIcon, MapPin, Upload } from 'lucide-react';
import { Button, Dialog, FormField, RadioCardGroup } from '../ui';
type PlanningMapCategory = string;
type PlanningMapStatus = string;
export type MapStudioValues = {
    code: string;
    title: string;
    category: string;
    status: string;
    description: string;
    imageUrl: string;
    sourceAttribution: string;
    barangaysText: string;
    scale: string;
    projection: string;
    effectivePeriod: string;
    authority: string;
    legendNotes: string;
    lat: number|string;
    lng: number|string;
};
export default function MapStudioView({ open, editing, onClose, values, onChange, onSubmit: handleSubmit, categories: PLANNING_MAP_CATEGORY_META, templates: PLANNING_MAP_TEMPLATES, barangays: TALIBON_BARANGAYS, statuses: STATUS_OPTIONS, onFileUpload: handleFileUpload, coordinatePicker, unavailable = [], busy = false, error, referenceFields, studioDescription = 'Register a planning map with its source, coverage, reference coordinates and visibility.' }: {
    open:boolean; editing:{code:string}|null; onClose:()=>void; values:MapStudioValues;
    onChange:(field:keyof MapStudioValues,value:string|number)=>void; onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
    categories:Record<string,{label:string}>; templates:ReadonlyArray<{id:string;imageUrl:string;sourceAttribution:string;label:string}>;
    barangays:readonly string[]; statuses:Array<{value:string;label:string;description:string}>;
    onFileUpload:(event:ChangeEvent<HTMLInputElement>)=>void; coordinatePicker:ReactNode;
    unavailable?:Array<keyof MapStudioValues>; busy?:boolean; error?:string|null; referenceFields?:ReactNode; studioDescription?:string;
}) {
    const [showCoordPicker,setShowCoordPicker] = useState(false);
    const {code,title,category,status,description,imageUrl,sourceAttribution,barangaysText,scale,projection,effectivePeriod,authority,legendNotes,lat,lng}=values;
    const setCode=(value:string)=>onChange('code',value);
    const setTitle=(value:string)=>onChange('title',value);
    const setCategory=(value:string)=>onChange('category',value);
    const setStatus=(value:string)=>onChange('status',value);
    const setDescription=(value:string)=>onChange('description',value);
    const setImageUrl=(value:string)=>onChange('imageUrl',value);
    const setSourceAttribution=(value:string)=>onChange('sourceAttribution',value);
    const setBarangaysText=(value:string)=>onChange('barangaysText',value);
    const setScale=(value:string)=>onChange('scale',value);
    const setProjection=(value:string)=>onChange('projection',value);
    const setEffectivePeriod=(value:string)=>onChange('effectivePeriod',value);
    const setAuthority=(value:string)=>onChange('authority',value);
    const setLegendNotes=(value:string)=>onChange('legendNotes',value);
    const setLat=(value:string)=>onChange('lat',value);
    const setLng=(value:string)=>onChange('lng',value);
    return (<Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title={editing ? `Edit Planning Map · ${editing.code}` : 'Add Municipal Planning Map'}
            description={studioDescription}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={busy} form="planning-map-crud-form">
                        {editing ? 'Save Map Changes' : 'Save Planning Map'}
                    </Button>
                </>
            }
        >
            <form id="planning-map-crud-form" onSubmit={handleSubmit} className="space-y-4">
                {referenceFields}
                {unavailable.length > 0 && <p role="note" className="text-xs text-[var(--ink-secondary)]">Disabled fields are unavailable in the current server contract.</p>}
                {error && (
                    <div role="alert" className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-sm font-semibold text-[var(--status-danger-fg)]">
                        {error}
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Map Code" htmlFor="pm-code" required>
                        <input
                            id="pm-code"
                            type="text"
                            required
                            disabled={unavailable.includes('code')} value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g., TAL-CLUP-2026-02"
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Category" htmlFor="pm-category" required>
                        <select
                            id="pm-category"
                            disabled={unavailable.includes('category')} value={category}
                            onChange={(e) => setCategory(e.target.value as PlanningMapCategory)}
                            className="tcds-input"
                        >
                            {(Object.keys(PLANNING_MAP_CATEGORY_META) as PlanningMapCategory[]).map((key) => (
                                <option key={key} value={key}>{PLANNING_MAP_CATEGORY_META[key].label}</option>
                            ))}
                        </select>
                    </FormField>
                </div>

                <FormField label="Map Title" htmlFor="pm-title" required>
                    <input
                        id="pm-title"
                        type="text"
                        required
                        disabled={unavailable.includes('title')} value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Poblacion Commercial & Institutional Zoning Plate"
                        className="tcds-input"
                    />
                </FormField>

                <RadioCardGroup
                    legend="Publication Visibility"
                    name="planning_map_status"
                    disabled={unavailable.includes('status')} value={status}
                    onChange={(next) => setStatus(next as PlanningMapStatus)}
                    options={STATUS_OPTIONS}
                />

                {/* Map plate image selector: upload local file OR pick Talibon placeholder template */}
                <fieldset disabled={unavailable.includes('imageUrl')} className="space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                        Map Plate Image
                    </legend>
                    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-white">
                        <img
                            src={imageUrl || undefined}
                            alt="Selected planning map plate preview"
                            className="h-36 w-full object-cover"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="municipal-secondary-button cursor-pointer">
                            <Upload size={15} aria-hidden="true" />
                            <span>Upload Plate Image</span>
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                        </label>
                        <div className="min-w-[14rem] flex-1">
                            <label htmlFor="pm-template" className="sr-only">Or pick a Talibon reference template</label>
                            <select
                                id="pm-template"
                                value={PLANNING_MAP_TEMPLATES.some((t) => t.imageUrl === imageUrl) ? imageUrl : ''}
                                onChange={(e) => {
                                    const picked = PLANNING_MAP_TEMPLATES.find((t) => t.imageUrl === e.target.value);
                                    if (picked) {
                                        setImageUrl(picked.imageUrl);
                                        setSourceAttribution(picked.sourceAttribution);
                                    }
                                }}
                                className="tcds-input"
                            >
                                <option value="">Choose Talibon reference plate…</option>
                                {PLANNING_MAP_TEMPLATES.map((tpl) => (
                                    <option key={tpl.id} value={tpl.imageUrl}>{tpl.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-[var(--ink-secondary)]">
                        <ImageIcon size={13} aria-hidden="true" />
                        <span className="truncate">{sourceAttribution}</span>
                    </p>
                </fieldset>

                <FormField
                    label="Description & Planning Context"
                    htmlFor="pm-desc"
                    hint="Explain what decisions, zones, or barangays this map covers."
                >
                    <textarea
                        id="pm-desc"
                        rows={3}
                        disabled={unavailable.includes('description')} value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Summarize the scope, coverage, and official use of this map plate…"
                        className="tcds-input min-h-24 resize-y"
                    />
                </FormField>

                <FormField
                    label="Covered Barangays"
                    htmlFor="pm-barangays"
                    hint={`Comma-separated barangay names (e.g., ${TALIBON_BARANGAYS.slice(0, 4).join(', ')} or All 25 Barangays).`}
                >
                    <input
                        id="pm-barangays"
                        type="text"
                        disabled={unavailable.includes('barangaysText')} value={barangaysText}
                        onChange={(e) => setBarangaysText(e.target.value)}
                        className="tcds-input"
                    />
                </FormField>

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Effective Period" htmlFor="pm-period">
                        <input
                            id="pm-period"
                            type="text"
                            disabled={unavailable.includes('effectivePeriod')} value={effectivePeriod}
                            onChange={(e) => setEffectivePeriod(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                    <FormField label="Scale" htmlFor="pm-scale">
                        <input
                            id="pm-scale"
                            type="text"
                            disabled={unavailable.includes('scale')} value={scale}
                            onChange={(e) => setScale(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Issuing Authority / Resolution" htmlFor="pm-authority">
                        <input
                            id="pm-authority"
                            type="text"
                            disabled={unavailable.includes('authority')} value={authority}
                            onChange={(e) => setAuthority(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                    <FormField label="Projection" htmlFor="pm-projection">
                        <input
                            id="pm-projection"
                            type="text"
                            disabled={unavailable.includes('projection')} value={projection}
                            onChange={(e) => setProjection(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                </div>

                {/* Coordinates + optional click-on-map picker */}
                <div className="space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            <MapPin size={14} aria-hidden="true" />
                            <span>Interactive Map Pin Location</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowCoordPicker((v) => !v)}
                            className="text-xs font-bold text-[var(--brand-ink)] hover:underline"
                        >
                            {showCoordPicker ? 'Hide map picker' : 'Pick on Talibon map'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Latitude" htmlFor="pm-lat">
                            <input
                                id="pm-lat"
                                type="number"
                                step="0.000001"
                                disabled={unavailable.includes('lat')} value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="Longitude" htmlFor="pm-lng">
                            <input
                                id="pm-lng"
                                type="number"
                                step="0.000001"
                                disabled={unavailable.includes('lng')} value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                    </div>
                    {showCoordPicker && (
                        <div className="pt-1">
                            <p className="mb-1.5 text-xs text-[var(--ink-secondary)]">Click anywhere in Talibon to drop the reference pin.</p>
                            {coordinatePicker}
                        </div>
                    )}
                </div>

                <FormField label="Legend & Symbology Notes" htmlFor="pm-legend" optional>
                    <input
                        id="pm-legend"
                        type="text"
                        disabled={unavailable.includes('legendNotes')} value={legendNotes}
                        onChange={(e) => setLegendNotes(e.target.value)}
                        placeholder="Key colors, boundaries, or advisory notes…"
                        className="tcds-input"
                    />
                </FormField>
            </form>
        </Dialog>);
}
