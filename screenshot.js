const puppeteer = require('puppeteer');
const path = require('path');
const { mkdirSync } = require('fs');

(async () => {

    const browser = await puppeteer.launch({ args: ['--disable-dev-shm-usage', '--no-sandbox'] });
    const page = await browser.newPage();
// Adjustments particular to this page to ensure we hit desktop breakpoint.
    await page.setViewport({width: 1000, height: 600, deviceScaleFactor: 1});

    const user = 'admin', password = 'district'
    const authString = Buffer.from(`${user}:${password}`).toString('base64')
    await page.setCookie({ name: 'JSESSIONID', value: '642BCC1F3E412D94D4F797EB685CBB5B', domain: 'debug.dhis2.org', session: true, httpOnly: true, secure: true, path: '/2.35.0' })
    await page.goto('http://localhost:8000', {
        waitUntil: 'networkidle2',
    });

    // page.waitForTimeout(60000)

    /**
     * Takes a screenshot of a DOM element on the page, with optional padding.
     *
     * @param {!{path:string, selector:string, padding:(number|undefined)}=} opts
     * @return {!Promise<!Buffer>}
     */
    async function screenshotDOMElement({ directory } = {}) {
        if (!directory)
            throw Error('Please provide an output directory.');
        
        mkdirSync(directory, { recursive: true })

        const elements = await page.$$('#target')
        await page.screenshot({ path: path.join(directory, 'page.png')})
        // console.log(await elements.map(async element => await element.type()))
        await Promise.all(
            elements.map(async (element, idx) => {
                await element.screenshot({
                    path: path.join(directory, `item-${idx}.png`)
                })
            })
        )

        browser.close()
    }

    await screenshotDOMElement({
        directory: './out'
    });

    browser.close();
})();