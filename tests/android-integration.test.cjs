const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const android = fs.readFileSync('android/app/src/main/java/com/breakfree/smokeless/beta/MainActivity.java','utf8');
const web = fs.readFileSync('index.html','utf8');
const bundled = fs.readFileSync('android/app/src/main/assets/index.html','utf8');
const billing = fs.readFileSync('android/app/src/main/java/com/breakfree/smokeless/beta/BillingManager.java','utf8');
const gradle = fs.readFileSync('android/app/build.gradle','utf8');

test('CSV file acceptance checks actual Unicode BOM rather than a literal escape', () => {
  assert.match(android,/codePointAt\(0\)\s*!=\s*0xFEFF/);
  assert.doesNotMatch(android,/csv\.startsWith\("\\\\uFEFF/);
  assert.match(android,/getBytes\(StandardCharsets\.UTF_8\)/);
});
test('Android and web have CSV export controls and local analytics', () => {
  for (const text of [web,bundled]) {
    assert.match(text,/data-action="export-csv"/);
    assert.match(text,/case 'export-csv':exportCsv\(\)/);
    assert.match(text,/src="\.\/analytics\.js"/);
  }
  assert.match(bundled,/BreakFreeAndroid\.saveCsv\(csv\)/);
  assert.match(android,/public void saveCsv\(String csv\)/);
});
test('subscription checkout remains disabled until verified provisioning', () => {
  assert.match(gradle,/BILLING_ENABLED', 'false'/);
  assert.doesNotMatch(billing,/launchBillingFlow\(/);
  assert.match(billing,/server-side verification/);
});
test('native app loads only bundled first-party resources', () => {
  assert.match(android,/WebViewAssetLoader/);
  assert.match(android,/getSettings\(\)\.setAllowFileAccess\(false\)/);
  assert.match(android,/openExternal\(url\)/);
});
