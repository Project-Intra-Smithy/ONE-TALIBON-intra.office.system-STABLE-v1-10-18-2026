import type { MunicipalSystem } from '../../data/municipal/systems';
import { getFutureSystemPrototype } from '../../data/municipal/futureSystemPrototypeData';
import FutureSystemPrototype from './FutureSystemPrototype';

type Props = {
    system: MunicipalSystem;
    onBack: () => void;
};

export default function FutureIntegrationDetail({ system, onBack }: Props) {
    return (
        <FutureSystemPrototype
            prototype={getFutureSystemPrototype(system.id)}
            onBack={onBack}
        />
    );
}
