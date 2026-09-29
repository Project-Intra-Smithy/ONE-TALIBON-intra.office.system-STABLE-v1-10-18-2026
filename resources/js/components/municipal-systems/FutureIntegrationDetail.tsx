import type { MunicipalSystem } from '../../data/municipal/systems';
import { getFutureSystemPrototype } from '../../data/municipal/futureSystemPrototypeData';
import FutureSystemPrototype from './FutureSystemPrototype';
import GISWorkspace from './GISWorkspace';

type Props = {
    system: MunicipalSystem;
    onBack: () => void;
};

export default function FutureIntegrationDetail({ system, onBack }: Props) {
    const prototype = getFutureSystemPrototype(system.id);

    if (system.id === 'FUT-03') {
        return <GISWorkspace prototype={prototype} onBack={onBack} />;
    }

    return (
        <FutureSystemPrototype
            prototype={prototype}
            onBack={onBack}
        />
    );
}
