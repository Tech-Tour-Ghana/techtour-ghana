import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readMinutes, withHeadingIds } from '../lib/content/toc.ts';

test('adds unique ids to h2 and h3 and lists them', () => {
  const { html, toc } = withHeadingIds('<h2>Getting there</h2><p>x</p><h3>By <em>air</em></h3><h2>Getting there</h2>');
  assert.deepEqual(toc.map((t) => t.id), ['getting-there', 'by-air', 'getting-there-2']);
  assert.deepEqual(toc.map((t) => t.level), [2, 3, 2]);
  assert.match(html, /<h2 id="getting-there">Getting there<\/h2>/);
  assert.match(html, /<h3 id="by-air">By <em>air<\/em><\/h3>/);
});

test('leaves empty headings alone and reads at least one minute', () => {
  assert.equal(withHeadingIds('<h2></h2>').toc.length, 0);
  assert.equal(readMinutes('<p>short</p>'), 1);
});
