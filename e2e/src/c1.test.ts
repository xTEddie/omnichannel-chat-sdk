const { chromium, firefox, webkit } = require('playwright');
const config = JSON.parse(process.env.CONFIG as string);

enum Selectors {
    SignInEmailInput = "#i0116",
    SignInNextButton = "#idSIButton9",
    SignInPasswordInput = "#i0118",
    SignInSignInButton = "#idSIButton9",
    SignInNoSaveButton = "#idBtn_Back",
    // Agent
    AvailabilityStatusBusyXPath = '//*[@title="Busy" or @title="Available" or @title="Do not disturb" or @title="Offline" or @title="Away" ]',
    AgentStatusButton = `//*[@data-id="Microsoft.Dynamics.Service.CIFramework.Presence.Dialog"]`,
    SelectStatusElement = `//*[@data-id="presence_id.fieldControl-option-set-select"]`,
    AgentStatusOkButton = `//*[@data-id="ok_id"]`,
}

enum Apps {
    OmnichannelForCustomerService = "Omnichannel for Customer Service"
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

const goToMyApp = async (page: any, appName: string) => {
    const iframe = await page.waitForSelector(`//iframe[@id="AppLandingPage"]`)
        .catch((error: any) => {
            throw new Error(`Can't verify that current page is App Landing Page. Inner exception: ${error.message}`);
        });

    const iframeNodes = await iframe.contentFrame();
    await iframeNodes.waitForSelector(`[title="${appName}"]`)
        .catch((error: any) => {
            throw new Error(`Can't verify that App Landing Page contains application with name "${appName}". Inner exception: ${error.message}`);
        });

    await iframeNodes.click(`[title="${appName}"]`);
    await page.waitForEvent("domcontentloaded");
  }

const waitForAgentStatus = async (page: any) => {
    await page.waitForSelector(Selectors.AvailabilityStatusBusyXPath)
    await page.waitForTimeout(2000);
}

const setAgentStatusToAvailable = async (page: any) => {
    await page.waitForSelector(Selectors.AvailabilityStatusBusyXPath)
    await page.click(Selectors.AgentStatusButton);

    const selectElement = await page.waitForSelector(
        Selectors.SelectStatusElement
    );
    selectElement.selectOption({
        label: 'Available'
    });

    await page.click(Selectors.AgentStatusOkButton);
    await page.waitForTimeout(1000);
}

describe("C1", () => {
    it("Open Omnichannel for Customer Service", async () => {
        const browser = await chromium.launch();        
        const context = await browser.newContext();
        const page = await context.newPage();

        await goToCrmPortal(page);
        await signIn(page);
        await goToCrmPortal(page);

        await goToMyApp(page, Apps.OmnichannelForCustomerService);
        await waitForAgentStatus(page);
        await setAgentStatusToAvailable(page);

        await page.screenshot({ path: 'screenshot.png' });
        await browser.close();
    });
});