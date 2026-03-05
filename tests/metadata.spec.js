import { test, expect } from '@playwright/test';

// 1x1 pixel PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

// ── ヘルパー ──

async function setupKenzenSurvey(page, name = '健全度テスト') {
  await page.goto('/');
  await page.waitForSelector('#surveyScreen', { state: 'visible', timeout: 10000 });
  await page.click('#btnNewSurvey');
  await page.fill('#surveyName', name);
  await page.selectOption('#surveyType', 'kenzen');
  await page.click('#btnSaveSurvey');
  await page.waitForSelector('.survey-item');
  await page.locator('.survey-item').filter({ hasText: name }).locator('.survey-info').click();
  await page.waitForSelector('#captureScreen', { state: 'visible' });
}

async function addNode(page, name) {
  await page.click('#btnAddNode');
  await page.fill('#nodeName', name);
  await page.click('#btnSaveNode');
  await page.waitForSelector(`.tree-node:has-text("${name}")`);
}

async function navigateToNode(page, name) {
  await page.locator('.tree-node').filter({ hasText: name }).click();
}

async function simulateCapture(page) {
  const countBefore = await page.locator('#currentCount').textContent();
  await page.locator('#fileInput').setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  await expect(page.locator('#currentCount')).not.toHaveText(countBefore, { timeout: 5000 });
}

// ── 健全度調査票 基本UI ──

test.describe('健全度調査票', () => {
  test.beforeEach(async ({ page }) => {
    await setupKenzenSurvey(page);
  });

  test('メタデータセクションが表示される', async ({ page }) => {
    await expect(page.locator('#metadataSection')).toBeVisible();
  });

  test('カテゴリタブが4つ表示される（外部/屋根/内部/設備）', async ({ page }) => {
    const tabs = page.locator('#categoryTabs button');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toContainText('外部');
    await expect(tabs.nth(1)).toContainText('屋根');
    await expect(tabs.nth(2)).toContainText('内部');
    await expect(tabs.nth(3)).toContainText('設備');
  });

  test('カテゴリ切り替えで部位リストが更新される', async ({ page }) => {
    // 外部の部位を取得
    const getParts = () => page.locator('#metaPart option').allTextContents();
    const partsGaibu = await getParts();

    // 屋根に切り替え
    await page.locator('#categoryTabs button').filter({ hasText: '屋根' }).click();
    const partsYane = await getParts();
    expect(partsYane).not.toEqual(partsGaibu);
    expect(partsYane).toContain('防水層');
  });

  test('部位選択で材質が絞り込まれる', async ({ page }) => {
    await page.selectOption('#metaPart', '外壁');
    const materials = await page.locator('#metaMaterial option').allTextContents();
    expect(materials.length).toBeGreaterThan(1);
    expect(materials).toContain('ALCﾊﾟﾈﾙ');
  });

  test('判定ボタンの選択/切替/解除', async ({ page }) => {
    const btnA = page.locator('#metadataSection .judgment-btn[data-val="A"]');
    const btnB = page.locator('#metadataSection .judgment-btn[data-val="B"]');

    // 選択
    await btnA.click();
    await expect(btnA).toHaveClass(/active/);

    // 切替
    await btnB.click();
    await expect(btnB).toHaveClass(/active/);
    await expect(btnA).not.toHaveClass(/active/);

    // 解除
    await btnB.click();
    await expect(btnB).not.toHaveClass(/active/);
  });

  test('標準調査ではメタデータセクションが非表示', async ({ page }) => {
    // 標準調査を別途作成
    await page.locator('#headerTitle').click();
    await page.waitForSelector('#surveyScreen', { state: 'visible' });
    await page.click('#btnNewSurvey');
    await page.fill('#surveyName', '標準テスト');
    // surveyType はデフォルト（空=標準）のまま
    await page.click('#btnSaveSurvey');
    await page.waitForSelector('.survey-item');
    await page.locator('.survey-item').filter({ hasText: '標準テスト' }).locator('.survey-info').click();
    await page.waitForSelector('#captureScreen', { state: 'visible' });

    await expect(page.locator('#metadataSection')).toBeHidden();
  });
});

// ── 撮影とメタデータ保存 ──

test.describe('撮影とメタデータ保存', () => {
  test.beforeEach(async ({ page }) => {
    await setupKenzenSurvey(page);
    await addNode(page, '本館');
    await navigateToNode(page, '本館');
  });

  test('撮影後に番号インクリメント+枚数増加', async ({ page }) => {
    await expect(page.locator('#currentNumber')).toContainText('001');
    await simulateCapture(page);
    await expect(page.locator('#currentNumber')).toContainText('002');
    await expect(page.locator('#currentCount')).toContainText('1枚撮影済み');
  });

  test('撮影後に最近の撮影に判定バッジが表示される', async ({ page }) => {
    await page.locator('#metadataSection .judgment-btn[data-val="A"]').click();
    await simulateCapture(page);
    await expect(page.locator('.recent-item .judgment-badge[data-val="A"]')).toBeVisible();
  });

  test('取り消しボタンで直前の撮影を削除', async ({ page }) => {
    await simulateCapture(page);
    await expect(page.locator('#currentCount')).toContainText('1枚撮影済み');

    page.on('dialog', dialog => dialog.accept());
    await page.click('#btnUndoSidebar');
    await expect(page.locator('#currentCount')).toContainText('0枚撮影済み');
    await expect(page.locator('#currentNumber')).toContainText('001');
  });

  test('連続撮影で番号が正しくインクリメントする', async ({ page }) => {
    await simulateCapture(page);
    await expect(page.locator('#currentNumber')).toContainText('002');
    await simulateCapture(page);
    await expect(page.locator('#currentNumber')).toContainText('003');
    await expect(page.locator('#currentCount')).toContainText('2枚撮影済み');
  });
});

// ── メタデータ編集 ──

test.describe('メタデータ編集', () => {
  test.beforeEach(async ({ page }) => {
    await setupKenzenSurvey(page);
    await addNode(page, '本館');
    await navigateToNode(page, '本館');
    // カテゴリ: 外部、部位: 外壁、判定: B で撮影
    await page.locator('#categoryTabs button').filter({ hasText: '外部' }).click();
    await page.selectOption('#metaPart', '外壁');
    await page.locator('#metadataSection .judgment-btn[data-val="B"]').click();
    await simulateCapture(page);
  });

  test('最近の撮影タップで編集モーダルが開く', async ({ page }) => {
    await page.locator('.recent-item').first().click();
    await expect(page.locator('#metaEditModal')).toBeVisible();
    await expect(page.locator('#metaEditPhoto')).toBeVisible();
    await expect(page.locator('#metaEditFilename')).not.toBeEmpty();
  });

  test('既存のメタデータが復元される', async ({ page }) => {
    await page.locator('.recent-item').first().click();
    await expect(page.locator('#metaEditModal')).toBeVisible();

    // カテゴリ: 外部がアクティブ
    await expect(
      page.locator('#metaEditCategoryTabs button.active')
    ).toContainText('外部');

    // 部位: 外壁が選択されている
    await expect(page.locator('#metaEditPart')).toHaveValue('外壁');

    // 判定: Bがアクティブ
    await expect(
      page.locator('#metaEditModal .judgment-btn[data-val="B"]')
    ).toHaveClass(/active/);
  });

  test('メタデータを変更して保存できる', async ({ page }) => {
    await page.locator('.recent-item').first().click();
    await expect(page.locator('#metaEditModal')).toBeVisible();

    // 判定をCに変更
    await page.locator('#metaEditModal .judgment-btn[data-val="C"]').click();
    await page.click('#btnSaveMetaEdit');
    await expect(page.locator('#metaEditModal')).toBeHidden();

    // バッジがCに変わっている
    await expect(page.locator('.recent-item .judgment-badge[data-val="C"]')).toBeVisible();
  });
});

// ── エクスポート ──

test.describe('エクスポート（健全度調査票）', () => {
  test.beforeEach(async ({ page }) => {
    await setupKenzenSurvey(page);
    await addNode(page, '本館');
    await navigateToNode(page, '本館');
    await page.locator('#metadataSection .judgment-btn[data-val="A"]').click();
    await simulateCapture(page);
  });

  test('写真と判定バッジが表示される', async ({ page }) => {
    await page.click('#btnExport');
    await expect(page.locator('#exportModal')).toBeVisible();

    // 統計: 1枚
    await expect(page.locator('.stat-value').first()).toContainText('1');

    // 判定バッジ
    await expect(page.locator('.photo-item')).toHaveCount(1);
    await expect(page.locator('.photo-item .judgment-badge[data-val="A"]')).toBeVisible();
  });

  test('写真を個別削除できる', async ({ page }) => {
    await page.click('#btnExport');
    await expect(page.locator('#exportModal')).toBeVisible();

    page.on('dialog', dialog => dialog.accept());
    await page.click('.photo-item-delete');

    // 再描画後に0枚
    await expect(page.locator('.stat-value').first()).toContainText('0');
  });

  test('エクスポート画面で写真タップから編集モーダルが開く', async ({ page }) => {
    await page.click('#btnExport');
    await expect(page.locator('#exportModal')).toBeVisible();

    await page.locator('.photo-item img').click();
    await expect(page.locator('#metaEditModal')).toBeVisible();
  });
});

// ── 3カラムレイアウト ──

test.describe('3カラムレイアウト', () => {
  test('メタデータが右サイドバーに表示される', async ({ page }) => {
    await setupKenzenSurvey(page);
    await expect(page.locator('#metadataSidebarSlot #metadataSection')).toBeVisible();
  });

  test('左サイドバーに調査ツリーが表示される', async ({ page }) => {
    await setupKenzenSurvey(page);
    await addNode(page, '本館');

    await expect(page.locator('.sidebar-left')).toBeVisible();
    await expect(page.locator('.tree-survey')).toBeVisible();
    await expect(page.locator('.tree-node').filter({ hasText: '本館' })).toBeVisible();
  });

  test('右サイドバーにカメラボタンが表示される', async ({ page }) => {
    await setupKenzenSurvey(page);
    await expect(page.locator('#btnCaptureSidebar')).toBeVisible();
  });

  test('ツリーから階層を選択できる', async ({ page }) => {
    await setupKenzenSurvey(page);
    await addNode(page, '本館');

    // ツリーの階層をクリック
    await page.locator('.tree-node').filter({ hasText: '本館' }).click();

    // パスが更新される
    await expect(page.locator('#currentPath')).toContainText('本館');
  });
});
