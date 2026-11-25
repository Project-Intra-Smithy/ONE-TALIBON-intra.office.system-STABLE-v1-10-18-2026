import PPAFilters from '../../../../../resources/js/components/ppas/PPAFilters';
import {municipalPlans} from '../../data/municipal/plans';
import {ppaOptions} from '../../data/municipal/ppas';
import type {ComponentProps} from 'react';
export default function PreviewPPAFilters(props:Pick<ComponentProps<typeof PPAFilters>,'filters'|'onChange'>){return <PPAFilters {...props} options={ppaOptions} planOptions={[...municipalPlans.map(plan=>({value:plan.id,label:plan.code+' — '+plan.title})),...ppaOptions.plans.filter(title=>!municipalPlans.some(plan=>plan.title.toLowerCase()===title.toLowerCase())).map(title=>({value:title,label:title}))]} />;}
