//#!/usr/bin/env node
// To run, you ned to set the following environment variables:
//
// - STILE_EMAIL: The email of the user to log in with
// - STILE_PASSWORD: The password of the user to log in with
//
// This needs to be a password account, don't use your @stileeducation.com one.
//
// The reports will be written to the `reports` directory in the root of the
// repository. You can then upload them to
// https://googlechrome.github.io/lighthouse/viewer/ to view them in a more
// human readable way. The score itself isn't super useful, at least initially,
// because we have nothing to compare it to but the measures themselves (e.g.
// TCP, etc.) are.

import { launch } from "puppeteer";
import lighthouse from "lighthouse";
import { URL } from "url";
import { writeFile } from "fs";

const PORT = 8041;

// Pages to query. The key is what the report file name will be.
const STILE_PAGES = {
  subjectsPage: "https://stileapp.com/au/1234567-10253",
  subjectPage: "https://stileapp.com/au/institutions/7126/subjects/108658",
  worksheetPage:
    "https://stileapp.com/au/qctestinstitution-7126/subject-108658/lesson-853706/worksheet-3964823",
};

const login = async (browser, origin) => {
  const page = await browser.newPage();
  await page.goto(origin);
  await page.waitForSelector('input[type="email"]', { visible: true });

  const emailInput = await page.$('input[type="email"]');
  await emailInput.type(process.env.STILE_EMAIL);
  const button = await page.$('button[data-test-label="emailSubmitButton"]');
  await button.evaluate((btn) => btn.click());
  // await page.waitForNavigation();

  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.type(process.env.STILE_PASSWORD);
  const passwordButton = await page.$('button[data-test-label="loginButton"]');
  await passwordButton.evaluate((btn) => btn.click());
  await page.waitForNavigation();

  await page.close();
};

const main = async () => {
  const browser = await launch({
    args: [`--remote-debugging-port=${PORT}`],
    headless: false,
    slowMo: 50,
  });

  await login(browser, "https://stileapp.com");
  for (page of Object.keys(STILE_PAGES)) {
    const result = await lighthouse(STILE_PAGES[page], {
      port: PORT,
      disableStorageReset: true,
    });
    writeFile(
      `reports/${page}.json`,
      JSON.stringify(result.lhr, null, 4),
      (err, _) => {
        if (err) {
          console.error(err);
        }
      }
    );
  }
  await browser.close();
};

main();
