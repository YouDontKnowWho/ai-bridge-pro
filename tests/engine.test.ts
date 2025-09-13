import { NanoBananaEngine } from '../src/core/engines/NanoBananaEngine';
// Node polyfills for test
// @ts-ignore
global.atob = (b64)=> Buffer.from(b64, 'base64').toString('binary');
// @ts-ignore
global.fetch = (url, opts)=> Promise.resolve({ ok: true, status: 200, json: async () => ({ image: Buffer.from('PNGDATA').toString('base64') }) });

test('nanobanana engine returns bytes', async () => {
  const eng = new NanoBananaEngine('https://api.example.com', 'KEY');
  const res = await eng.generate({engine:'nanobanana', prompt:'hello', negative:'', seed:null, strength:0.7, refWeight:0, refImage:null, region:null});
  expect(res.image.byteLength).toBeGreaterThan(0);
});