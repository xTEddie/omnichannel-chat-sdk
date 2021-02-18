
import {OmnichannelChatSDK} from '@microsoft/omnichannel-chat-sdk';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

const acsResourceEndpoint = "https://{0}-Trial-acs.communication.azure.com";

class ChatSDKProxy {
    private debug: boolean;
    private chatToken: any;
    private chatAdapterConfig: any;
    private chatClient: any;
    private chatThreadClient: any;

    public constructor(private proxy: any) {
        this.debug = false;
        this.chatToken = {};
        this.initialize();
        this.setDebug(true);
    }

    public setDebug(flag: boolean): void {
        this.debug = flag;
    }

    public async initialize() {
        this.debug && console.log(`[ChatSDKProxy][initialize]`);
    }

    public async startChat(optionalParams: any = {}) {
        this.debug && console.log(`[ChatSDKProxy][startChat]`);

        if (optionalParams.liveChatContext) {
            this.chatToken = optionalParams.liveChatContext.chatToken;
            this.proxy.requestId = optionalParams.liveChatContext.requestId;

            // Update chat adapter config
            this.chatAdapterConfig = {
                token: this.chatToken.token,
                id: this.chatToken.visitorId || 'teamsvisitor',
                threadId: this.chatToken.chatId,
                environmentUrl: acsResourceEndpoint.replace('{0}', this.proxy.omnichannelConfig.orgId)
            };
        }

        if (this.chatToken && Object.keys(this.chatToken).length === 0) {
            await this.getChatToken(false);
        }

        this.debug && console.log(`[ChatSDKProxy][startChat] Chat token`);
        this.debug && console.log(this.chatToken);

        const sessionInitOptionalParams = {
            initContext: {} as any
        };

        if (optionalParams.preChatResponse) {
            sessionInitOptionalParams.initContext.preChatResponse = optionalParams.preChatResponse;
        }

        try {
            await this.proxy.OCClient.sessionInit(this.proxy.requestId, optionalParams);
            this.debug && console.log(`[ChatSDKProxy][startChat][sessionInit][success]`);
        } catch (error) {
            console.error(`[ChatSDKProxy][startChat][sessionInit][error] ${error}`);
            return error;
        }

        const tokenCredential = new AzureCommunicationTokenCredential(this.chatToken.token);
        this.chatClient = new ChatClient(this.chatAdapterConfig.environmentUrl, tokenCredential);

        const thread = await this.chatClient.getChatThread(this.chatAdapterConfig.threadId);
        this.debug && console.log(`[ChatSDKProxy][thread]`);
        this.debug && console.log(thread);

        this.chatThreadClient = await this.chatClient.getChatThreadClient(this.chatAdapterConfig.threadId);
        this.debug && console.log(`[ChatSDKProxy][chatThreadClient]`);
        this.debug && console.log(this.chatThreadClient);

        // Subscribes to real time notifications
        await this.chatClient.startRealtimeNotifications();
    }

    public async endChat() {
        this.debug && console.log(`[ChatSDKProxy][endChat]`);
        const sessionCloseOptionalParams = {};
        try {
            await this.proxy.OCClient.sessionClose(this.proxy.requestId, sessionCloseOptionalParams);
            this.chatToken = {};
            this.chatAdapterConfig = {};
            this.chatClient = null;
            this.chatThreadClient = null;
        } catch (error) {
            console.error(`[ChatSDKProxy][endChat][sessionClose][error] ${error}`);
            return error;
        }
    }

    public async getCurrentLiveChatContext() {
        this.debug && console.log(`[ChatSDKProxy][getCurrentLiveChatContext]`);
        const chatToken = await this.getChatToken();
        const {requestId} = this.proxy;

        const chatSession = {
            chatToken,
            requestId
        }

        if (Object.keys(chatSession.chatToken).length === 0) {
            return {};
        }

        return chatSession;
    }

    public async getPreChatSurvey(parse = true): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        this.debug && console.log(`[ChatSDKProxy][getPreChatSurvey]`);
        return this.proxy.getPreChatSurvey(parse);
    }

    public async getLiveChatConfig(cached = true): Promise<any> {
        this.debug && console.log(`[ChatSDKProxy][getLiveChatConfig]`);
        return this.proxy.getLiveChatConfig(cached);
    }

    public async getChatToken(cached = true) {
        this.debug && console.log(`[ChatSDKProxy][getChatToken]`);

        if (!cached) {
            const chatToken = await this.proxy.getChatToken(cached);
            this.chatToken = chatToken;

            // Update chat adapter config
            this.chatAdapterConfig = {
                token: this.chatToken.token,
                id: this.chatToken.visitorId || 'teamsvisitor',
                threadId: this.chatToken.chatId,
                environmentUrl: acsResourceEndpoint.replace('{0}', this.proxy.omnichannelConfig.orgId)
            };

        }

        this.debug && console.log(`[ChatSDKProxy][chatAdapterConfig]`);
        this.debug && console.log(this.chatAdapterConfig);
        return this.chatToken;
    }

    public async getMessages() {
        this.debug && console.log(`[ChatSDKProxy][getMessages]`);
        return [];
    }

    public async getDataMaskingRules() {
        this.debug && console.log(`[ChatSDKProxy][getDataMaskingRules]`);
        return this.proxy.getDataMaskingRules();
    }

    public async sendMessage(message: any) {
        this.debug && console.log(`[ChatSDKProxy][sendMessage]`);

        const sendMessageRequest = {
            content: message.content,
            senderDisplayName: message.userDisplayName? message.userDisplayName: undefined
        }

        const response = await this.chatThreadClient.sendMessage(sendMessageRequest);
        this.debug && console.log(response);
    }

    public onNewMessage(onNewMessageCallback: CallableFunction) {
        this.chatClient.on("chatMessageReceived", (message: any) => {
            this.debug && console.log('[ChatSDKProxy][Event][chatMessageReceived]');
            this.debug && console.log(message);

            const {sender, recipient} = message;

            // Filter out customer messages
            const customerMessageCondition = (sender.user.communicationUserId === recipient.communicationUserId) || (sender.user.communicationUserId === this.chatAdapterConfig.id)
            if (customerMessageCondition) {
                return;
            }

            onNewMessageCallback(message);
        });
    }

    public async sendTypingEvent(): Promise<void> {
        this.debug && console.log(`[ChatSDKProxy][sendTypingEvent]`);
    }

    public async onTypingEvent(onTypingEventCallback: CallableFunction): Promise<void> {
        this.debug && console.log(`[ChatSDKProxy][onTypingEvent]`);
    }

    public async onAgentEndSession(onAgentEndSessionCallback: (message: any) => void): Promise<void> {
        this.debug && console.log(`[ChatSDKProxy][onAgentEndSession]`);
    }

    public async uploadFileAttachment(fileInfo: any): Promise<any> {
        this.debug && console.log(`[ChatSDKProxy][uploadFileAttachment]`);
    }

    public async downloadFileAttachment(fileMetadata: any): Promise<any> {
        this.debug && console.log(`[ChatSDKProxy][downloadFileAttachment]`);
    }

    public async emailLiveChatTranscript(body: any): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        this.debug && console.log(`[ChatSDKProxy][emailLiveChatTranscript]`);
        // return this.proxy.emailLiveChatTranscript(body);
    }

    public async getLiveChatTranscript(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        this.debug && console.log(`[ChatSDKProxy][getLiveChatTranscript]`);
        // return this.proxy.getLiveChatTranscript();
    }

    public async createChatAdapter(protocol: string = 'ACS'): Promise<unknown> {
        this.debug && console.log(`[ChatSDKProxy][createChatAdapter]`);
        return this.proxy.createChatAdapter(protocol);
    }

    public async getVoiceVideoCalling(params: any = {}): Promise<any> {
        this.debug && console.log(`[ChatSDKProxy][getVoiceVideoCalling]`);
        // return this.proxy.getVoiceVideoCalling(params);
    }
}

const createChatSDK = async (omnichannelConfig: any, chatSDKConfig: any = {}) => {
    const chatSDK = new OmnichannelChatSDK(omnichannelConfig, chatSDKConfig);
    await chatSDK.initialize();
    const chatConfig: any = await chatSDK.getLiveChatConfig();

    const {LiveChatVersion: liveChatVersion} = chatConfig;
    console.log(chatConfig);
    console.log(`[ChatSDKProxy][LiveChatVersion] ${liveChatVersion}`);

    if (liveChatVersion === 1) {
        return chatSDK; // Returns default ChatSDK using IC3
    }

    const chatSDKProxy = new ChatSDKProxy(chatSDK);
    await chatSDKProxy.initialize();
    return chatSDKProxy; // Returns ChatSDKProxy using ACS
}

export default createChatSDK;

