import { Image as ImageIcon, MapPin, Upload } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import {
    PLANNING_MAP_CATEGORY_META,
    PLANNING_MAP_TEMPLATES,
    TALIBON_BARANGAYS,
    TALIBON_CENTER,
    type PlanningMapCategory,
    type PlanningMapRecord,
    type PlanningMapStatus,
} from '../../data/municipal/planningMaps';
import { Button, Dialog, FormField, RadioCardGroup } from '../ui';
import TalibonInteractiveMap from './TalibonInteractiveMap';

type Props = {
    open: boolean;
    editing: PlanningMapRecord | null;
    actorName: string;
    onClose: () => void;
    onSave: (record: PlanningMapRecord) => void;
};

const STATUS_OPTIONS = [
    { value: 'published', label: 'Published', description: 'Visible to all LGU staff' },
    { value: 'draft', label: 'Draft', description: 'MPDC staff & Head only' },
    { value: 'archived', label: 'Archived', description: 'Hidden from active gallery' },
];

export default function PlanningMapFormDrawer({ open, editing, actorName, onClose, onSave }: Props) {
    const [code, setCode] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<PlanningMapCategory>('clup_zoning');
    const [status, setStatus] = useState<PlanningMapStatus>('published');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState<string>(PLANNING_MAP_TEMPLATES[0].imageUrl);
    const [sourceAttribution, setSourceAttribution] = useState<string>(PLANNING_MAP_TEMPLATES[0].sourceAttribution);
    const [barangaysText, setBarangaysText] = useState('All 25 Barangays');
    const [scale, setScale] = useState('1 : 50,000');
    const [projection, setProjection] = useState('WGS84 / UTM Zone 51 North');
    const [effectivePeriod, setEffectivePeriod] = useState('2026–2029');
    const [authority, setAuthority] = useState('MPDC Talibon Reference Plate');
    const [legendNotes, setLegendNotes] = useState('');
    const [lat, setLat] = useState<number>(TALIBON_CENTER.lat);
    const [lng, setLng] = useState<number>(TALIBON_CENTER.lng);
    const [error, setError] = useState<string | null>(null);
    const [showCoordPicker, setShowCoordPicker] = useState(false);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setShowCoordPicker(false);
        if (editing) {
            setCode(editing.code);
            setTitle(editing.title);
            setCategory(editing.category);
            setStatus(editing.status);
            setDescription(editing.description);
            setImageUrl(editing.imageUrl);
            setSourceAttribution(editing.sourceAttribution);
            setBarangaysText(editing.barangays.join(', '));
            setScale(editing.scale);
            setProjection(editing.projection);
            setEffectivePeriod(editing.effectivePeriod);
            setAuthority(editing.authority);
            setLegendNotes(editing.legendNotes);
            setLat(editing.lat);
            setLng(editing.lng);
        } else {
            const seq = String(Math.floor(10 + Math.random() * 89));
            setCode(`TAL-MAP-2026-${seq}`);
            setTitle('');
            setCategory('clup_zoning');
            setStatus('published');
            setDescription('');
            setImageUrl(PLANNING_MAP_TEMPLATES[0].imageUrl);
            setSourceAttribution(PLANNING_MAP_TEMPLATES[0].sourceAttribution);
            setBarangaysText('Poblacion, San Jose, San Isidro');
            setScale('1 : 50,000');
            setProjection('WGS84 / UTM Zone 51 North');
            setEffectivePeriod('2026–2029');
            setAuthority('MPDC Talibon Reference Plate');
            setLegendNotes('');
            setLat(TALIBON_CENTER.lat);
            setLng(TALIBON_CENTER.lng);
        }
    }, [open, editing]);

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select a PNG, JPEG, or WebP map plate image.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setImageUrl(reader.result);
                setSourceAttribution(`Uploaded by ${actorName} (${file.name})`);
                setError(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim() || !code.trim()) {
            setError('Map Code and Map Title are required.');
            return;
        }
        const barangays = barangaysText
            .split(',')
            .map((b) => b.trim())
            .filter(Boolean);

        const nextRecord: PlanningMapRecord = {
            id: editing?.id || `map-${Date.now()}`,
            code: code.trim().toUpperCase(),
            title: title.trim(),
            category,
            status,
            description: description.trim() || 'Municipal planning cartographic reference maintained by MPDC Talibon.',
            imageUrl,
            sourceAttribution: sourceAttribution.trim() || 'MPDC Talibon',
            barangays: barangays.length ? barangays : ['All 25 Barangays'],
            scale: scale.trim() || '1 : 50,000',
            projection: projection.trim() || 'WGS84 / UTM Zone 51 North',
            effectivePeriod: effectivePeriod.trim() || '2026',
            authority: authority.trim() || 'MPDC Talibon',
            lat: Number.isFinite(lat) ? lat : TALIBON_CENTER.lat,
            lng: Number.isFinite(lng) ? lng : TALIBON_CENTER.lng,
            legendNotes: legendNotes.trim() || 'Refer to map plate legend for symbology and zone classifications.',
            updatedAt: new Date().toISOString(),
            updatedBy: actorName,
            isPlaceholder: imageUrl.startsWith('/maps/'),
        };

        onSave(nextRecord);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title={editing ? `Edit Planning Map · ${editing.code}` : 'Add Municipal Planning Map'}
            description="MPDC Department Head & Designated Staff map registry editor. Published maps are immediately visible to all LGU personnel."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="planning-map-crud-form">
                        {editing ? 'Save Map Changes' : 'Save Planning Map'}
                    </Button>
                </>
            }
        >
            <form id="planning-map-crud-form" onSubmit={handleSubmit} className="space-y-4">
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
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g., TAL-CLUP-2026-02"
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Category" htmlFor="pm-category" required>
                        <select
                            id="pm-category"
                            value={category}
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
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Poblacion Commercial & Institutional Zoning Plate"
                        className="tcds-input"
                    />
                </FormField>

                <RadioCardGroup
                    legend="Publication Visibility"
                    name="planning_map_status"
                    value={status}
                    onChange={(next) => setStatus(next as PlanningMapStatus)}
                    options={STATUS_OPTIONS}
                />

                {/* Map plate image selector: upload local file OR pick Talibon placeholder template */}
                <fieldset className="space-y-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                        Map Plate Image
                    </legend>
                    <div className="overflow-hidden rounded-lg border border-[var(--border-default)] bg-white">
                        <img
                            src={imageUrl}
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
                        value={description}
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
                        value={barangaysText}
                        onChange={(e) => setBarangaysText(e.target.value)}
                        className="tcds-input"
                    />
                </FormField>

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Effective Period" htmlFor="pm-period">
                        <input
                            id="pm-period"
                            type="text"
                            value={effectivePeriod}
                            onChange={(e) => setEffectivePeriod(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                    <FormField label="Scale" htmlFor="pm-scale">
                        <input
                            id="pm-scale"
                            type="text"
                            value={scale}
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
                            value={authority}
                            onChange={(e) => setAuthority(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                    <FormField label="Projection" htmlFor="pm-projection">
                        <input
                            id="pm-projection"
                            type="text"
                            value={projection}
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
                                step="0.0001"
                                value={lat}
                                onChange={(e) => setLat(Number(e.target.value))}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="Longitude" htmlFor="pm-lng">
                            <input
                                id="pm-lng"
                                type="number"
                                step="0.0001"
                                value={lng}
                                onChange={(e) => setLng(Number(e.target.value))}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                    </div>
                    {showCoordPicker && (
                        <div className="pt-1">
                            <p className="mb-1.5 text-xs text-[var(--ink-secondary)]">Click anywhere in Talibon to drop the reference pin.</p>
                            <TalibonInteractiveMap
                                pins={[]}
                                pickMode
                                pickedCoords={{ lat, lng }}
                                onPickCoords={(coords) => {
                                    setLat(coords.lat);
                                    setLng(coords.lng);
                                }}
                                showZones={false}
                                showRoadCorridor={false}
                                heightClass="h-52"
                                ariaLabel="Click to pick map pin coordinates in Talibon"
                            />
                        </div>
                    )}
                </div>

                <FormField label="Legend & Symbology Notes" htmlFor="pm-legend" optional>
                    <input
                        id="pm-legend"
                        type="text"
                        value={legendNotes}
                        onChange={(e) => setLegendNotes(e.target.value)}
                        placeholder="Key colors, boundaries, or advisory notes…"
                        className="tcds-input"
                    />
                </FormField>
            </form>
        </Dialog>
    );
}
