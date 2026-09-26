import PortalSearchField from '../portal/PortalSearchField';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
export default function PortalHeaderSearch() {
    const [query, setQuery] = useState('');
    return <form role="search" className="portal-header-search" onSubmit={(event) => { event.preventDefault(); router.get('/portal-search', { q: query }); }}><PortalSearchField label="Search Portal" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search portal destinations, plans and PPAs..." /><button className="portal-header-search-submit" type="submit" aria-label="Search Portal"><Search size={18} aria-hidden="true" /></button></form>;
}
