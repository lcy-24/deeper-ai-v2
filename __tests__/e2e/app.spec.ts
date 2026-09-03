// ============================================================
// E2E 测试 — 核心用户流程
// ============================================================

import { test, expect } from '@playwright/test';

test.describe('Deeper AI v2 E2E', () => {
  test('首页加载正常', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar-logo')).toHaveText('Deeper AI');
  });

  test('创建新会话并发送消息', async ({ page }) => {
    await page.goto('/');

    // 点击新建会话
    await page.click('text=+ 新对话');

    // 输入消息
    const textarea = page.locator('.chat-input');
    await textarea.fill('Hello, this is a test message');
    await textarea.press('Enter');

    // 验证消息已发送
    await expect(page.locator('.message-bubble.user')).toBeVisible();
  });

  test('切换模型', async ({ page }) => {
    await page.goto('/');

    // 选择模型
    const select = page.locator('.chat-header select');
    await select.selectOption('gpt-4o');
    await expect(select).toHaveValue('gpt-4o');
  });

  test('打开设置面板', async ({ page }) => {
    await page.goto('/');

    // 点击设置按钮
    await page.click('text=设置');

    // 验证设置面板可见
    await expect(page.locator('.settings-panel')).toBeVisible();
  });
});