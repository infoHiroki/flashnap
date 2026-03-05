import { test, expect } from '@playwright/test';

test.describe('Flashnap 基本UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#surveyScreen', { state: 'visible', timeout: 10000 });
  });

  test('初期表示: タイトルが表示される', async ({ page }) => {
    await expect(page.locator('#headerTitle')).toContainText('Flashnap');
  });

  test('初期表示: 調査選択画面が表示される', async ({ page }) => {
    await expect(page.locator('#surveyScreen')).toBeVisible();
  });

  test('設定モーダルが開閉できる', async ({ page }) => {
    await page.click('#btnSettings');
    await expect(page.locator('#settingsModal')).toBeVisible();

    await page.click('#btnCloseSettingsModal');
    await expect(page.locator('#settingsModal')).toBeHidden();
  });
});

test.describe('調査管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#surveyScreen', { state: 'visible', timeout: 10000 });
  });

  test('新規調査を作成できる', async ({ page }) => {
    await page.click('#btnNewSurvey');
    await expect(page.locator('#surveyModal')).toBeVisible();

    await page.fill('#surveyName', 'テスト調査');
    await page.click('#btnSaveSurvey');

    await expect(page.locator('.survey-item').filter({ hasText: 'テスト調査' })).toBeVisible();
  });

  test('調査を選択して撮影画面に移動できる', async ({ page }) => {
    // 調査作成
    await page.click('#btnNewSurvey');
    await page.fill('#surveyName', '撮影テスト');
    await page.click('#btnSaveSurvey');
    await page.waitForSelector('.survey-item');

    // 調査を選択
    await page.locator('.survey-item').filter({ hasText: '撮影テスト' }).locator('.survey-info').click();

    await expect(page.locator('#captureScreen')).toBeVisible();
    await expect(page.locator('#btnCaptureSidebar')).toBeVisible();
  });
});

test.describe('階層管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#surveyScreen', { state: 'visible', timeout: 10000 });

    // 調査作成して撮影画面へ
    await page.click('#btnNewSurvey');
    await page.fill('#surveyName', '階層テスト');
    await page.click('#btnSaveSurvey');
    await page.waitForSelector('.survey-item');
    await page.locator('.survey-item').filter({ hasText: '階層テスト' }).locator('.survey-info').click();
    await page.waitForSelector('#captureScreen', { state: 'visible' });
  });

  test('階層を追加できる', async ({ page }) => {
    await page.click('#btnAddNode');
    await expect(page.locator('#nodeModal')).toBeVisible();

    await page.fill('#nodeName', '本館');
    await page.click('#btnSaveNode');

    await expect(page.locator('.tree-node').filter({ hasText: '本館' })).toBeVisible();
  });

  test('階層をネストできる', async ({ page }) => {
    // 親階層作成
    await page.click('#btnAddNode');
    await page.fill('#nodeName', '本館');
    await page.click('#btnSaveNode');
    await page.waitForSelector('.tree-node');

    // 親階層に入る（ツリーで選択）
    await page.locator('.tree-node').filter({ hasText: '本館' }).click();

    // 子階層作成
    await page.click('#btnAddNode');
    await page.fill('#nodeName', '1階');
    await page.click('#btnSaveNode');

    await expect(page.locator('.tree-node').filter({ hasText: '1階' })).toBeVisible();
  });

  test('選択中のノードに編集・削除ボタンが表示される', async ({ page }) => {
    await page.click('#btnAddNode');
    await page.fill('#nodeName', '本館');
    await page.click('#btnSaveNode');
    await page.waitForSelector('.tree-node');

    // 未選択時はアクションボタン非表示
    const node = page.locator('.tree-node').filter({ hasText: '本館' });
    await expect(node.locator('.tree-item-actions')).toBeHidden();

    // 選択するとアクションボタン表示
    await node.click();
    await expect(node.locator('.tree-item-actions')).toBeVisible();
  });

  test('ツリーからノード名を編集できる', async ({ page }) => {
    await page.click('#btnAddNode');
    await page.fill('#nodeName', '本館');
    await page.click('#btnSaveNode');
    await page.waitForSelector('.tree-node');

    // ノードを選択
    await page.locator('.tree-node').filter({ hasText: '本館' }).click();

    // 編集ボタンクリック
    await page.locator('.tree-node.selected .btn-edit-node').click();
    await expect(page.locator('#nodeModal')).toBeVisible();
    await expect(page.locator('#nodeName')).toHaveValue('本館');

    // 名前を変更して保存
    await page.fill('#nodeName', '南棟');
    await page.click('#btnSaveNode');

    await expect(page.locator('.tree-node').filter({ hasText: '南棟' })).toBeVisible();
    await expect(page.locator('.tree-node').filter({ hasText: '本館' })).toHaveCount(0);
  });

  test('ツリーからノードを削除できる', async ({ page }) => {
    await page.click('#btnAddNode');
    await page.fill('#nodeName', '本館');
    await page.click('#btnSaveNode');
    await page.waitForSelector('.tree-node');

    // ノードを選択
    await page.locator('.tree-node').filter({ hasText: '本館' }).click();

    // 削除ボタンクリック
    page.on('dialog', dialog => dialog.accept());
    await page.locator('.tree-node.selected .btn-delete-node').click();

    await expect(page.locator('.tree-node').filter({ hasText: '本館' })).toHaveCount(0);
  });
});

test.describe('設定', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#surveyScreen', { state: 'visible', timeout: 10000 });
  });

  test('ダークモードを切り替えできる', async ({ page }) => {
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal', { state: 'visible' });

    // ラベル要素をクリック（チェックボックスはCSSで非表示）
    await page.locator('label:has(#darkModeToggle)').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.locator('label:has(#darkModeToggle)').click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
  });

  test('デバイス保存設定を切り替えできる', async ({ page }) => {
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal', { state: 'visible' });

    const toggle = page.locator('#downloadToDeviceToggle');
    await expect(toggle).not.toBeChecked();

    // ラベル要素をクリック
    await page.locator('label:has(#downloadToDeviceToggle)').click();
    await expect(toggle).toBeChecked();
  });

  test('Google Drive接続ボタンが表示される', async ({ page }) => {
    await page.click('#btnSettings');
    await page.waitForSelector('#settingsModal', { state: 'visible' });
    await expect(page.locator('#btnConnectGoogleDrive')).toBeVisible();
  });
});
