import { useMemo, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AnnouncementRegister from '../../components/announcements/AnnouncementRegister';
import { municipalAnnouncements } from '../../data/municipal/announcements';

export default function Index() {
    const [q, setQ] = useState('');
    const [priority, setPriority] = useState('');
    const items = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return municipalAnnouncements.filter((announcement) =>
            (!priority || announcement.priority === priority)
            && (!needle || [announcement.title, announcement.issuingOffice, announcement.audience, announcement.summary, announcement.relatedDocument].join(' ').toLowerCase().includes(needle))
        );
    }, [q, priority]);

    const counts = {
        urgent: items.filter((item) => item.priority === 'Urgent').length,
        important: items.filter((item) => item.priority === 'Important').length,
        routine: items.filter((item) => item.priority === 'Routine').length,
    };

    return <AppLayout title="Announcements"><PageFrame>
        <PageHeader
            eyebrow="General municipal notices"
            title="Announcements"
            description="General municipal and office notices for operational information. Formal numbered internal issuances, recipient delivery, and acknowledgement belong in Official Memoranda."
            icon={Bell}
            aside={<div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-[#142236]"><span className="font-bold text-slate-950 dark:text-slate-100">{items.length} visible</span><span className="text-rose-700 dark:text-rose-300">{counts.urgent} urgent</span><span className="text-amber-700 dark:text-amber-300">{counts.important} important</span><span className="text-slate-500 dark:text-slate-400">{counts.routine} routine</span></div>}
        />
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#142236] sm:grid-cols-[1fr_220px]">
            <label className="relative">
                <span className="sr-only">Search announcements</span>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search notice, office, audience, or document" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            </label>
            <select aria-label="Announcement priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="">All priorities</option>
                <option>Routine</option>
                <option>Important</option>
                <option>Urgent</option>
            </select>
        </div>
        <AnnouncementRegister items={items} />
    </PageFrame></AppLayout>;
}
