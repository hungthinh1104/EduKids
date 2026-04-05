import test from 'node:test';
import assert from 'node:assert/strict';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE_URL = process.env.UI_BASE_URL || 'http://localhost:3000';

async function createDriver() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--window-size=1440,900');

  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

test('landing page smoke: hero actions are visible', async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${BASE_URL}/`);

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
    await driver.get(`${BASE_URL}/login`);

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
    await driver.get(`${BASE_URL}/register`);

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
