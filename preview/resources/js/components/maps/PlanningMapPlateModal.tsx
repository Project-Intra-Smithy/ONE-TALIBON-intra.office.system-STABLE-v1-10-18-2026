import MapPlateDialog from '../../../../../resources/js/components/maps/MapPlateDialog';
import { PLANNING_MAP_CATEGORY_META, type PlanningMapRecord } from '../../data/municipal/planningMaps';
import { formatDatePH } from '../../lib/format';
export default function PlanningMapPlateModal({map,onClose}:{map:PlanningMapRecord|null;onClose:()=>void}) {
    if(!map)return null;
    return <MapPlateDialog key={map.id} open onClose={onClose} title={map.title} description={`${map.code} · ${map.effectivePeriod}`} status={map.status==='published'?'Published · All LGU Staff':map.status==='draft'?'Draft · MPDC Only':'Archived'} category={PLANNING_MAP_CATEGORY_META[map.category].label} imageUrl={map.imageUrl} filename={`${map.code.toLowerCase()}.jpg`} note={map.description} metadata={[
        ['Covered Barangays',map.barangays.join(', ')],['Authority / Reference',map.authority],['Scale & Projection',`${map.scale} · ${map.projection}`],['Map Pin Coordinates',`${map.lat.toFixed(4)}° N, ${map.lng.toFixed(4)}° E`],['Legend & Notes',map.legendNotes],['Source Attribution & Last Update',`${map.sourceAttribution} · Updated ${formatDatePH(map.updatedAt)} by ${map.updatedBy}`]
    ]} />;
}
