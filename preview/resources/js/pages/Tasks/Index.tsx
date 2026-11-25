import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import PersonalTaskMutationPanel from '../../components/tasks/PersonalTaskMutationPanel';
import PersonalTaskWorkspace from '../../components/tasks/PersonalTaskWorkspace';
import { PageHeader } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';

/** Dedicated Inertia entry; /tasks JSON endpoints own task reads and mutations. */
export default function Index() {
    return (
        <AppLayout title="My Tasks">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Personal workspace"
                    title="My Tasks"
                    subtitle="Create, start, and complete personal daily tasks. Formal inter-office Work Requests are tracked in Work Requests."
                    actions={
                        <Link href="/transactions" className="municipal-primary-button">
                            <span>Work Requests</span>
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    }
                />
                <div className="space-y-5">
                    <PersonalTaskMutationPanel />
                    <PersonalTaskWorkspace />
                </div>
            </div>
        </AppLayout>
    );
}
