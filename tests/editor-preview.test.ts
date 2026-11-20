import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { DEMO_EMPLOYEES } from '../src/lib/demo';
import { EMPTY_EMPLOYEE } from '../src/lib/employee';
import { currentPreview, editorIssues, editorPreviewReducer as reduce, initialEditorPreview } from '../src/lib/editor-preview';
import { buildCard, previewCard } from '../src/lib/renderer';
import { getTemplate } from '../src/lib/templates';

const company = 'gti';
const blank = previewCard(EMPTY_EMPLOYEE, company);
const initial = () => initialEditorPreview(company, EMPTY_EMPLOYEE, blank);
const issues = (state: ReturnType<typeof initial>) => editorIssues(state.input.employee, state.input.companyId, currentPreview(state));

test('current input clears required errors immediately and validates normalized email and phone', () => {
  let state = initial();
  assert.ok(issues(state).some(i => i.message === 'Last name is required.'));
  state = reduce(state, { type: 'change', employee: { ...EMPTY_EMPLOYEE, lastName: 'VINAYAN', email: 'invalid', mobile: 'abc' } });
  assert.equal(currentPreview(state), undefined);
  assert.ok(!issues(state).some(i => i.field === 'lastName'));
  assert.ok(issues(state).some(i => i.field === 'email'));
  assert.ok(issues(state).some(i => i.field === 'mobile'));
  state = reduce(state, { type: 'change', employee: { ...state.input.employee, email: ' work@example.com ', mobile: ' +971 50 123 4567 ' } });
  assert.ok(!issues(state).some(i => ['email', 'mobile'].includes(i.field)));
});

test('late successes and failures cannot change a newer draft, even after editing back', () => {
  const sample = DEMO_EMPLOYEES.gti;
  let state = reduce(initial(), { type: 'change', employee: sample });
  const old = state.input;
  state = reduce(state, { type: 'change', employee: { ...sample, designation: 'A'.repeat(150) } });
  state = reduce(state, { type: 'success', input: state.input, preview: previewCard(state.input.employee, company) });
  assert.ok(issues(state).some(i => i.code === 'overflow-designation'));
  state = reduce(state, { type: 'change', employee: sample });
  assert.ok(!issues(state).some(i => i.code === 'overflow-designation'));
  assert.equal(reduce(state, { type: 'success', input: old, preview: blank }), state);
  assert.equal(reduce(state, { type: 'failure', input: old, message: 'old failure' }), state);
  assert.equal(currentPreview(state), undefined);
  state = reduce(state, { type: 'failure', input: state.input, message: 'current failure' });
  assert.equal(state.error, 'current failure');
  assert.equal(currentPreview(state), undefined);
});

test('only an accepted exact sample is reused, within its own editor and company', () => {
  const sample = DEMO_EMPLOYEES.gti;
  const valid = previewCard(sample, company);
  let state = reduce(initial(), { type: 'change', employee: sample });
  state = reduce(state, { type: 'success', input: state.input, preview: valid });
  assert.equal(currentPreview(state), valid);
  state = reduce(state, { type: 'change', employee: EMPTY_EMPLOYEE });
  assert.equal(currentPreview(state), blank);
  state = reduce(state, { type: 'change', employee: { ...sample, extension: '123', workPhone: '+971 4 123 4567' } });
  assert.equal(currentPreview(state), undefined);
  state = reduce(state, { type: 'change', employee: sample });
  assert.equal(currentPreview(state), valid);
  let other = initialEditorPreview('doubleLeaf', DEMO_EMPLOYEES.doubleLeaf, previewCard(EMPTY_EMPLOYEE, 'doubleLeaf'));
  other = reduce(other, { type: 'success', input: other.input, preview: valid });
  assert.equal(currentPreview(other), undefined);
  assert.match(other.error, /company/);
});

for (const companyId of ['gti','doubleLeaf'] as const) {
  test(companyId + ' compact scan preview matches every encoded module and its quiet zone', async () => {
    const employee = DEMO_EMPLOYEES[companyId];
    const qr = buildCard(employee, companyId).qr!;
    const svg = previewCard(employee, companyId).qr!.svg;
    const quiet = getTemplate(companyId).design.qr.quietModules;
    const size = qr.modules + 2 * quiet;
    const pixels = svg.replace(/width="[^"]+" height="[^"]+"/, `width="${size}" height="${size}"`);
    const raw = await sharp(Buffer.from(pixels)).greyscale().removeAlpha().raw().toBuffer();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const inMatrix = x >= quiet && y >= quiet && x < size - quiet && y < size - quiet;
      assert.equal(raw[y*size+x], inMatrix && qr.matrix.get(y-quiet,x-quiet) ? 0 : 255);
    }
  });
}
