import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./tests",
  testMatch: /browser\.spec\.mjs/,
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:" + PORT,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--ignore-gpu-blocklist",
            "--disable-dev-shm-usage"
          ]
        }
      }
    }
  ],
  webServer: {
    command: "node server.mjs",
    url: "http://127.0.0.1:" + PORT + "/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
