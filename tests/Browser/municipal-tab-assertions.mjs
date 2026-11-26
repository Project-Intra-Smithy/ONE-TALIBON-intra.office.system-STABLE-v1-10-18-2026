import assert from 'node:assert/strict';
/** Behavioral assertions are shared by canonical and isolated municipal browser runs. */
export async function verifyMunicipalTabs(page, list) {
    const tabs = list.getByRole('tab'), count = await tabs.count();
    assert.ok(count >= 3);
    const inspect = async () => {
        const state = await list.evaluate(node => [...node.querySelectorAll('[role=tab]')].map(tab => { const panel = document.getElementById(tab.getAttribute('aria-controls')); return { id: tab.id, selected: tab.getAttribute('aria-selected') === 'true', tabIndex: tab.tabIndex, controls: tab.getAttribute('aria-controls'), panel: panel ? { id: panel.id, role: panel.getAttribute('role'), labelledBy: panel.getAttribute('aria-labelledby'), hidden: panel.hidden, tabIndex: panel.tabIndex } : null }; }));
        assert.equal(state.filter(t => t.selected).length, 1);
        assert.equal(state.filter(t => t.tabIndex === 0).length, 1);
        for (const tab of state) {
            assert.ok(tab.id);
            assert.ok(tab.panel);
            assert.equal(tab.panel.role, 'tabpanel');
            assert.equal(tab.panel.labelledBy, tab.id);
            assert.equal(tab.panel.hidden, !tab.selected);
            assert.equal(tab.tabIndex, tab.selected ? 0 : -1);
        }
        return state.findIndex(t => t.selected);
    };
    const start = await inspect();
    await tabs.nth(start).focus();
    for (const [key, index] of [['Home', 0], ['ArrowLeft', count - 1], ['ArrowRight', 0], ['End', count - 1], ['Home', 0]]) {
        await page.keyboard.press(key);
        await page.waitForFunction(({ id, index }) => { const list = document.getElementById(id); return list && list.querySelectorAll('[role=tab]')[index] === document.activeElement; }, { id: await list.evaluate(n => { n.id ||= 'qa-tablist-' + crypto.randomUUID(); return n.id; }), index });
        assert.equal(await inspect(), index, key + ' selection');
        const outline = await tabs.nth(index).evaluate(n => ({ style: getComputedStyle(n).outlineStyle, width: parseFloat(getComputedStyle(n).outlineWidth) }));
        assert.equal(outline.style, 'solid');
        assert.ok(outline.width >= 2);
    }
    await page.keyboard.press('Tab');
    const selected = await inspect();
    const panel = page.locator('[id="' + (await tabs.nth(selected).getAttribute('aria-controls')).replaceAll('"', '\\"') + '"]');
    assert.ok(await panel.evaluate(n => n === document.activeElement), 'Tab exits roving list to selected panel');
    const target = count - 1;
    await tabs.nth(target).focus();
    await page.keyboard.press('Enter');
    assert.equal(await inspect(), target, 'native Enter activation');
    await tabs.first().focus();
    await page.keyboard.press('Space');
    assert.equal(await inspect(), 0, 'native Space activation');
    await tabs.nth(start).click();
    assert.equal(await inspect(), start, 'restore original selection');
    return { name: await list.getAttribute('aria-label'), tabs: count, keys: ['Home', 'ArrowLeft wrap', 'ArrowRight wrap', 'End', 'Tab exit', 'Enter', 'Space'], panelAssociations: true, rovingFocus: true };
}
