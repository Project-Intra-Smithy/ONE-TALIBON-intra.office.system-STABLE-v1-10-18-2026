import { Link } from '@inertiajs/react';
import { ArrowRight, ListChecks } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PersonalTaskMutationPanel from '../../components/tasks/PersonalTaskMutationPanel';
import PersonalTaskWorkspace from '../../components/tasks/PersonalTaskWorkspace';
import AppLayout from '../../layouts/AppLayout';

/** Dedicated Inertia entry; the existing /tasks JSON endpoints own all task data and writes. */
export default function Index() {
    return (
        <AppLayout title="My Tasks">
            <PageFrame className="civic-page aj-page-workspace" density="comfortable">
                <PageHeader
                    eyebrow="Personal workspace"
                    title="My Tasks"
                    description="Create, review, start and complete your own Tasks. Formal Work Requests are managed separately."
                    icon={ListChecks}
                    aside={<Link href="/transactions" className="municipal-action inline-flex items-center gap-2">Work Requests <ArrowRight size={16} aria-hidden="true" /></Link>}
                />
                <div className="mt-5 space-y-5">
                    <PersonalTaskMutationPanel />
                    <PersonalTaskWorkspace />
                </div>
            </PageFrame>
        </AppLayout>
    );
}
