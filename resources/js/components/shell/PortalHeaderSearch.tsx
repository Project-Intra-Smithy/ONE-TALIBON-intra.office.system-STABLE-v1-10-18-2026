import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
export default function PortalHeaderSearch() {
    const [query, setQuery] = useState('');
    return <form role="search" className="portal-header-search" onSubmit={(event) => { event.preventDefault(); router.get('/portal-search', { q: query }); }}><label className="sr-only" htmlFor="portal-header-query">Search Portal</label><input id="portal-header-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search portal destinations, plans and PPAs..." /><button type="submit" aria-label="Search Portal"><Search size={18} aria-hidden="true" /></button></form>;
}
