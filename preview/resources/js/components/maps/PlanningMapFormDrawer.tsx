import MapStudioView from '../../../../../resources/js/components/maps/MapStudioView';
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

    return <MapStudioView open={open} editing={editing} onClose={onClose} values={{code,title,category,status,description,imageUrl,sourceAttribution,barangaysText,scale,projection,effectivePeriod,authority,legendNotes,lat,lng}} onChange={(field,value)=>{switch(field){case 'code': setCode(value as string); break; case 'title': setTitle(value as string); break; case 'category': setCategory(value as PlanningMapCategory); break; case 'status': setStatus(value as PlanningMapStatus); break; case 'description': setDescription(value as string); break; case 'imageUrl': setImageUrl(value as string); break; case 'sourceAttribution': setSourceAttribution(value as string); break; case 'barangaysText': setBarangaysText(value as string); break; case 'scale': setScale(value as string); break; case 'projection': setProjection(value as string); break; case 'effectivePeriod': setEffectivePeriod(value as string); break; case 'authority': setAuthority(value as string); break; case 'legendNotes': setLegendNotes(value as string); break; case 'lat': setLat(value as number); break; case 'lng': setLng(value as number); break;}}} onSubmit={handleSubmit} categories={PLANNING_MAP_CATEGORY_META} templates={PLANNING_MAP_TEMPLATES} barangays={TALIBON_BARANGAYS} statuses={STATUS_OPTIONS} onFileUpload={handleFileUpload} error={error} coordinatePicker={<TalibonInteractiveMap
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
                            />} />;
}
