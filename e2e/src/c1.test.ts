const { chromium, firefox, webkit } = require('playwright');
const config = JSON.parse(process.env.CONFIG as string);

enum Selectors {
    SignInEmailInput = "#i0116",
    SignInNextButton = "#idSIButton9",
    SignInPasswordInput = "#i0118",
    SignInSignInButton = "#idSIButton9",
    SignInNoSaveButton = "#idBtn_Back",
}

const goToCrmPortal = async (page: any) => {
    await page.goto(config.crmUrl, {
        waitUntil: "networkidle"
    });
}

const signIn = async (page: any) => {        
    await page.fill(Selectors.SignInEmailInput, config.accountEmail, {
        timeout: 10000,
    });

    await page.click(Selectors.SignInNextButton);

    await page.fill(Selectors.SignInPasswordInput, config.accountPassword, {
        timeout: 10000,
    });
    
    await page.click(Selectors.SignInSignInButton);

    await page.click(Selectors.SignInNoSaveButton);
}

describe("C1", () => {
    it("Sign In", async () => {
        const browser = await chromium.launch();        
        const context = await browser.newContext();
        const page = await context.newPage();

        await goToCrmPortal(page);
        await signIn(page);
        await goToCrmPortal(page);
        
        await page.screenshot({ path: 'screenshot.png' });
        await browser.close();
    });
});