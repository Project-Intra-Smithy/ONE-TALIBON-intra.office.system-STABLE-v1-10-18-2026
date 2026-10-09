import test from 'node:test';
import assert from 'node:assert/strict';
import { fixturePage, previewScreens } from '../resources/js/visual-fixtures.ts';

test('every preview screen mounts an existing Inertia component with a visible synthetic label', () => {
    for (const { key } of previewScreens) {
        const fixture = fixturePage(key);
        assert.ok(fixture.component);
        assert.ok(fixture.url.startsWith('/'));
        assert.equal(fixture.props.auth.user.name, 'Preview Employee');
        assert.match(fixture.props.auth.user.email, /example\.test$/);
    }
});

test('role fixture is bounded to supported role presentations', () => {
    assert.equal(fixturePage('dashboard', 'department_head').props.experience.key, 'department_head');
    assert.equal(fixturePage('dashboard', 'unrecognized').props.experience.key, 'employee');
});
