import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE_URL = process.env.UI_BASE_URL || 'http://localhost:3000';
const REMOTE_URL = process.env.SELENIUM_REMOTE_URL || '';
const HEADLESS = process.env.SELENIUM_HEADLESS !== 'false';

function normalizeBaseUrlForRemote(url) {
  return url
    .replace('://localhost', '://host.docker.internal')
    .replace('://127.0.0.1', '://host.docker.internal')
    .replace('://0.0.0.0', '://host.docker.internal');
}

const DRIVER_BASE_URL = REMOTE_URL ? normalizeBaseUrlForRemote(BASE_URL) : BASE_URL;

async function assertUrlReachable(url, label) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`${label} returned HTTP ${res.status}`);
    }
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} is not reachable at ${url}. ${details}`);
  }
}

before(async () => {
  await assertUrlReachable(BASE_URL, 'Frontend app');
  if (REMOTE_URL) {
    await assertUrlReachable(REMOTE_URL.replace(/\/wd\/hub$/, '/ui'), 'Selenium Grid');
  }
});

async function createDriver() {
  const options = new chrome.Options();
  if (HEADLESS) {
    options.addArguments('--headless=new');
  }
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--window-size=1440,900');

  let builder = new Builder().forBrowser('chrome').setChromeOptions(options);

  if (REMOTE_URL) {
    builder = builder.usingServer(REMOTE_URL);
  }

  return builder.build();
}

test('landing page smoke: hero actions are visible', async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${DRIVER_BASE_URL}/`);

    const loginLink = await driver.wait(
      until.elementLocated(By.css('a[href="/login"]')),
      10000,
    );
    const registerLink = await driver.wait(
      until.elementLocated(By.css('a[href="/register"]')),
      10000,
    );

    assert.equal(await loginLink.isDisplayed(), true);
    assert.equal(await registerLink.isDisplayed(), true);
  } finally {
    await driver.quit();
  }
});

test('login page smoke: email/password and submit exist', async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${DRIVER_BASE_URL}/login`);

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000,
    );
    const passwordInput = await driver.wait(
      until.elementLocated(By.css('input[type="password"]')),
      10000,
    );
    const submitCta = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(),'Khởi hành ngay!')]")),
      10000,
    );

    assert.equal(await emailInput.isDisplayed(), true);
    assert.equal(await passwordInput.isDisplayed(), true);
    assert.equal(await submitCta.isDisplayed(), true);
  } finally {
    await driver.quit();
  }
});

test('register page smoke: core fields and policy links exist', async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${DRIVER_BASE_URL}/register`);

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000,
    );
    const passwordInputs = await driver.findElements(By.css('input[type="password"]'));
    const termsLink = await driver.wait(
      until.elementLocated(By.css('a[href="/terms"]')),
      10000,
    );
    const privacyLink = await driver.wait(
      until.elementLocated(By.css('a[href="/privacy"]')),
      10000,
    );

    assert.equal(await emailInput.isDisplayed(), true);
    assert.ok(passwordInputs.length >= 2);
    assert.equal(await termsLink.isDisplayed(), true);
    assert.equal(await privacyLink.isDisplayed(), true);
  } finally {
    await driver.quit();
  }
});

test('forgot-password page smoke: email field and submit button exist', async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${DRIVER_BASE_URL}/forgot-password`);

    const emailInput = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000,
    );
    const submitBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Gửi link đặt lại')]") ),
      10000,
    );

    assert.equal(await emailInput.isDisplayed(), true);
    assert.equal(await submitBtn.isDisplayed(), true);
  } finally {
    await driver.quit();
  }
});

test('navigation smoke: landing login link routes to /login', async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${DRIVER_BASE_URL}/`);

    const loginLink = await driver.wait(
      until.elementLocated(By.css('a[href="/login"]')),
      10000,
    );
    await loginLink.click();

    await driver.wait(until.urlContains('/login'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    assert.equal(currentUrl.includes('/login'), true);
  } finally {
    await driver.quit();
  }
});
