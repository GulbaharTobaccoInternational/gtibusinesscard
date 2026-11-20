import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

for (const type of ['invite', 'recovery']) {
  test(`${type} email has one Supabase action and keeps the proof out of asset URLs`, () => {
    const body = readFileSync(new URL(`../supabase/templates/${type}.html`, import.meta.url), 'utf8');
    const links = Array.from(body.matchAll(/<a\s[^>]*href="([^"]+)"/gi), match => match[1]);
    assert.deepEqual(links, [
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}&amp;next={{ .RedirectTo }}`,
      'https://www.mrghashi.com',
    ]);
    assert.equal(body.match(/\{\{\s*\.TokenHash\s*\}\}/g)?.length, 1);
    for (const [, source] of body.matchAll(/<img\s[^>]*src="([^"]+)"/gi)) {
      assert.match(source, /^https:\/\/www\.mrghashi\.com\/brand\/email\/[a-z-]+\.png$/);
    }
  });
}
