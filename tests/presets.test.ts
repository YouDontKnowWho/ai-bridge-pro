import { PresetsStore } from '../src/core/presets/PresetsStore';

test('presets load defaults then save custom', () => {
  const p = new PresetsStore();
  const def = p.list();
  expect(def.length).toBeGreaterThan(10);
  const modified = def.slice(0,3);
  modified[0].name = 'Custom A';
  p.save(modified);
  const got = p.list();
  expect(got.length).toBe(3);
  expect(got[0].name).toBe('Custom A');
  p.reset();
  expect(p.list().length).toBeGreaterThan(10);
});