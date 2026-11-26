import { useId, type KeyboardEvent, type ReactNode } from 'react';

export function useMunicipalTabs(selected: string, values: readonly string[]) {
    const id = useId();
    const tabId = (value: string) => `${id}-tab-${encodeURIComponent(value)}`;
    const panelId = (value: string) => `${id}-panel-${encodeURIComponent(value)}`;
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const list = event.currentTarget;
        const current = (event.target as HTMLElement).closest<HTMLButtonElement>('button[role="tab"]');
        if (!current || current.closest('[role="tablist"]') !== list) return;
        const tabs = [...list.querySelectorAll<HTMLButtonElement>('button[role="tab"]')]
            .filter(tab => !tab.disabled && tab.getAttribute('aria-disabled') !== 'true');
        const index = tabs.indexOf(current);
        if (index < 0) return;
        let next: number;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next]?.focus();
        tabs[next]?.click();
    };
    return {
        selected, values, tabId, panelId,
        listProps: { role: 'tablist', 'aria-orientation': 'horizontal', onKeyDown } as const,
        tabProps: (value: string) => ({
            id: tabId(value), role: 'tab' as const, 'aria-controls': panelId(value),
            'aria-selected': selected === value, tabIndex: selected === value ? 0 : -1,
        }),
    };
}

export function MunicipalTabPanels({ tabs, children }: { tabs: ReturnType<typeof useMunicipalTabs>; children: ReactNode }) {
    return <div>{tabs.values.map(value => <div key={value} id={tabs.panelId(value)} role="tabpanel" className="space-y-2.5"
        aria-labelledby={tabs.tabId(value)} hidden={value !== tabs.selected} tabIndex={0}>
        {value === tabs.selected ? children : null}
    </div>)}</div>;
}
