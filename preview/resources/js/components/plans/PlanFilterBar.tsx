import PlanFilterBar from '../../../../../resources/js/components/plans/PlanFilterBar';
import {planStatuses} from '../../data/municipal/plans';
import type {ComponentProps} from 'react';
export type {PlanFilters} from '../../../../../resources/js/components/plans/PlanFilterBar';
export default function PreviewPlanFilterBar(props:ComponentProps<typeof PlanFilterBar>){return <PlanFilterBar {...props} statuses={planStatuses} />;}
