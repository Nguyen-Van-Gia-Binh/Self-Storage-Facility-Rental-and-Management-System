import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Chạy tuần tự để đảm bảo State Machine không bị xung đột
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh', // BR-GEN-06
    video: 'on',                   // Ghi video 100% các run để nộp bằng chứng DoD
    trace: 'retain-on-failure',    // Thu thập Trace Viewer khi fail hoặc bật 'on'
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
