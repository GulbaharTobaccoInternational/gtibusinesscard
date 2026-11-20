import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

for (const type of ['invite', 'recovery']) {
  test(`${type} email has one Supabase action and keeps the proof out of asset URLs`, () => {
    const body = readFileSync(new URL(`../supabase/templates/${type}.html`, import.meta.url), 'utf8');
    assert.match(body, /<meta name="color-scheme" content="light dark">/);
    assert.match(body, /<meta name="supported-color-schemes" content="light dark">/);
    for (const [cell] of body.matchAll(/<td\b[^>]*>/gi)) {
      const color = cell.match(/bgcolor="(#[a-f0-9]{6})"/i)?.[1];
      assert.ok(color && cell.includes(`background-color:${color};`), 'Each cell needs a matching inline and HTML background');
    }
    assert.match(body, /@media \(prefers-color-scheme: dark\)/);
    assert.doesNotMatch(body, /An Internal Web Application|by GTI Marketing Department/i);
    if (type === 'recovery') assert.doesNotMatch(body, /<h1\b|Need a new password\?|heading-rays\.png/i);
    else assert.match(body, /<h1[^>]*>Welcome to Mr Ghashi!<\/h1>/);
    const logos = Array.from(body.matchAll(/<img class="(logo-(?:light|dark))[^"]*"[^>]+>/g));
    assert.deepEqual(logos.map(([, theme]) => theme), ['logo-light', 'logo-dark', 'logo-light', 'logo-dark']);
    const files = logos.map(([img, theme]) => {
      if (theme === 'logo-dark') {
        assert.match(img, / hidden /);
        assert.match(img, /width="0" height="0"/);
        assert.match(img, /display:none/);
        assert.match(img, /mso-hide:all/);
      }
      return img.match(/src="[^"]+\/([^"/]+)"/)?.[1];
    });
    assert.deepEqual(files, ['mr-ghashi-white.png', 'mr-ghashi-dark.png', 'gti-ink-black.png', 'gti-ink-white.png']);
    const links = Array.from(body.matchAll(/<a\s[^>]*href="([^"]+)"/gi), match => match[1]);
    assert.deepEqual(links, [
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}&amp;next={{ .RedirectTo }}`,
      'https://www.mrghashi.com',
    ]);
    assert.equal(body.match(/\{\{\s*\.TokenHash\s*\}\}/g)?.length, 1);
    for (const [, source] of body.matchAll(/<img\s[^>]*src="([^"]+)"/gi)) {
      assert.ok(existsSync(new URL(`../public${new URL(source).pathname}`, import.meta.url)), `Missing email asset: ${source}`);
      assert.match(source, /^https:\/\/www\.mrghashi\.com\/brand\/email\/[a-z-]+\.png$/);
    }
  });
}
