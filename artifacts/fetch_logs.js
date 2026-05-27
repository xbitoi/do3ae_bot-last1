import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log(`[Browser Console ${msg.type()}]`, msg.text());
  });
  page.on("pageerror", (err) => {
    console.log(`[Browser PageError]`, err.toString());
  });

  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
