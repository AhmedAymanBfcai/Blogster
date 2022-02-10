const puppeteer = require('puppeteer');

test('Adding two numbers', () => {
  const sum = 1 + 2;
  expect(sum).toEqual(3);
});

test('We can launch a browser', async () => {
  const browser = await puppeteer.launch({
    headless: false, // Whenver you use the term headless means that the browser will open without some GUI. By assign it for false that mean Do not start in headless mode.
  });
  const page = await browser.newPage();
  await page.goto('localhost:3000');

  const text = await page.$eval('a.brand-logo', (el) => el.innerHTML);
  expect(text).toEqual('Blogster');
  //   jest.setTimeout(30000);
}, 30000); //Timeout - Async callback was not invoked within the 5000ms timeout specified by jest.setTimeout. so we passed 30000
