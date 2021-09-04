import OmnichannelChatSDK from '../../src/OmnichannelChatSDK';

describe("Live Chat", () => {
    const config = JSON.parse(process.env.CONFIG as string);

    it("Read Environment Config", () => {
        expect(config).toBeTruthy();
    });

    it("Sending a Single Message", async () => {
        const chatSDK = new OmnichannelChatSDK({
            orgId: config.orgId,
            orgUrl: config.orgUrl,
            widgetId: config.widgetIds.liveChat
        }, {
            telemetry: {
                disable: true
            }
        });

        await chatSDK.initialize();

        await chatSDK.startChat();

        await chatSDK.sendMessage({
            content: 'Hello!'
        });

        await chatSDK.endChat();
    });
});