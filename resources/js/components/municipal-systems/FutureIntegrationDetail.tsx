import type { MunicipalSystem } from '../../data/municipal/systems';
import { getFutureSystemPrototype } from '../../data/municipal/futureSystemPrototypeData';
import AssetPropertyWorkspace from './AssetPropertyWorkspace';
import BudgetMonitoringWorkspace from './BudgetMonitoringWorkspace';
import BuildingPermitWorkspace from './BuildingPermitWorkspace';
import CitizenActionWorkspace from './CitizenActionWorkspace';
import FutureSystemPrototype from './FutureSystemPrototype';
import GISWorkspace from './GISWorkspace';
import MotorpoolFleetWorkspace from './MotorpoolFleetWorkspace';
import TrainingKnowledgeWorkspace from './TrainingKnowledgeWorkspace';

type Props = {
    system: MunicipalSystem;
    onBack: () => void;
};

export default function FutureIntegrationDetail({ system, onBack }: Props) {
    const prototype = getFutureSystemPrototype(system.id);

    if (system.id === 'FUT-02') {
        return <BudgetMonitoringWorkspace onBack={onBack} />;
    }

    if (system.id === 'FUT-03') {
        return <GISWorkspace prototype={prototype} onBack={onBack} />;
    }

    if (system.id === 'FUT-05') {
        return (
            <BuildingPermitWorkspace
                prototype={prototype}
                onBack={onBack}
            />
        );
    }

    if (system.id === 'FUT-07') {
        return (
            <CitizenActionWorkspace
                prototype={prototype}
                onBack={onBack}
            />
        );
    }

    if (system.id === 'FUT-10') {
        return <AssetPropertyWorkspace onBack={onBack} />;
    }

    if (system.id === 'FUT-12') {
        return <MotorpoolFleetWorkspace onBack={onBack} />;
    }

    if (system.id === 'FUT-15') {
        return (
            <TrainingKnowledgeWorkspace
                prototype={prototype}
                onBack={onBack}
            />
        );
    }

    return (
        <FutureSystemPrototype
            prototype={prototype}
            onBack={onBack}
        />
    );
}
