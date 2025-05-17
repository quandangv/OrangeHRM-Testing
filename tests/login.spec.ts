import { expect } from "@playwright/test";
import { test } from "../pages/fixtures";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";

// Test logging in with the correct credentials: log in successful
test("log in", async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login("Admin");
  const dashboardPage = new DashboardPage(loginPage);
  await expect(dashboardPage.identifier).toBeVisible();
});

// Test out using the profile menu: log out successful
test("log out", async ({ dashboardPage }) => {
  await dashboardPage.logout();
  const loginPage = new LoginPage(dashboardPage);
  await expect(loginPage.loginButton).toBeVisible();
});

// Try accessing the dashboard without loggin in: blocked, navigated to the login page
test("access dashboard without login", async ({ loginPage, page }) => {
  await page.goto("/web/index.php/dashboard/index");
  const dashboardPage = new DashboardPage(page);
  await expect(dashboardPage.identifier).not.toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
});

// Log in with the wrong credential: unsuccessful
test("wrong login credential", async ({ loginPage }) => {
  await loginPage.login("Admin", "wrong password");
  const dashboardPage = new DashboardPage(loginPage);
  await expect(dashboardPage.identifier).not.toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();

  await loginPage.login("wrongusername", "admin123");
  await expect(dashboardPage.identifier).not.toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();

  await loginPage.login("wrongusername", "wrong password");
  await expect(dashboardPage.identifier).not.toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
});
