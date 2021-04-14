
import {OmnichannelChatSDK} from '@microsoft/omnichannel-chat-sdk';
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
// import { CommunicationSignalingClient } from "@azure/communication-signaling";
// import { createClientLogger } from "@azure/logger";
import { EventEmitter } from 'events';
import { ChatMessageReceivedEvent } from '@azure/communication-signaling';

const acsResourceEndpoint = "https://{0}-Trial-acs.communication.azure.com";

class ChatSDKProxy {
    private debug: boolean;
    private chatToken: any;
    private chatAdapterConfig: any;
    private chatClient: any;
    private chatThreadClient: any;
    private allMessages: any;
    private eventEmitter: any;
    private participantsMapping: any;

    public constructor(private proxy: any) {
        this.debug = false;
        this.chatToken = {};
        this.allMessages = [];
        this.eventEmitter = new EventEmitter();
        this.participantsMapping = {};
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

        try {
            this.chatClient = new ChatClient(this.chatAdapterConfig.environmentUrl, tokenCredential);
            // this.chatClient.signalingClient = new CommunicationSignalingClient(tokenCredential, createClientLogger("communication-chat"));
            this.debug && console.log(`[ChatSDKProxy][chatClient]`);

            // Mock method to avoid 'Error: Realtime notifications are only supported in the browser.'
            // this.chatClient.on = (event: string, listener: any) => {
            //     console.log('[ChatSDKProxy][chatClient][on]');
            //     console.log(event);
            //     console.log(listener);
            // };
        } catch {
            this.debug && console.log(`[ChatSDKProxy][chatClient] Failed`);
        }

        // try {
        //     const thread = await this.chatClient.getChatThread(this.chatAdapterConfig.threadId);
        //     // this.debug && console.log(`[ChatSDKProxy][thread]`);
        //     // this.debug && console.log(thread);
        // } catch {
        //     this.debug && console.log(`[ChatSDKProxy][thread] Failed`);
        // }

        try {
            this.chatThreadClient = await this.chatClient.getChatThreadClient(this.chatAdapterConfig.threadId);
            // this.debug && console.log(`[ChatSDKProxy][chatThreadClient]`);
            // this.debug && console.log(this.chatThreadClient);
        } catch {
            this.debug && console.log(`[ChatSDKProxy][chatThreadClient] Failed`);
        }

        // const participants = await this.listParticipants();
        // this.createParticipantSMapping(participants);

        // Subscribes to real time notifications
        await this.chatClient.startRealtimeNotifications(); // WebSocket
        //await this.startNonRealtimeNotifications(); // HTTP Call Polling
        // await this.getMessages();
    }

    public async startNonRealtimeNotifications() {
        this.debug && console.log(`[ChatSDKProxy][startNonRealtimeNotifications]`);
        const ms = 1 * 1000;
        setInterval( async () => {
            try {
                const messages = await this.getMessages(true);
                if (this.allMessages.length !== messages.length) {
                    this.allMessages = messages;
                    console.log(`[ChatSDKProxy][NonRealtimeNotifcation][NewMessage]`);
                    console.log(messages[0]);
                    this.eventEmitter.emit('chatMessageReceived', messages[0]);
                }
            } catch {

            }
        }, ms);
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
            this.allMessages = [];
            this.participantsMapping = {};
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

    public async getMessages(notifications = false) {
        this.debug && !notifications && console.log(`[ChatSDKProxy][getMessages]`);

        const messages: any = [];
        const pagedAsyncIterableIterator = await this.chatThreadClient.listMessages();
        let nextMessage = await pagedAsyncIterableIterator.next();
        while (!nextMessage.done) {
            let chatMessage = nextMessage.value;

            // Filter text type messages only
            if (chatMessage.type === 'text') {
                messages.push(chatMessage);
            }

            nextMessage = await pagedAsyncIterableIterator.next();
        }

        return messages;
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
        // this.eventEmitter.addListener("chatMessageReceived", (message: any) => {
            this.debug && console.log('[ChatSDKProxy][Event][chatMessageReceived]');
            // this.debug && console.log(message);

            const {sender} = message;

            // console.log(`[this.chatAdapterConfig.id] ${this.chatAdapterConfig.id}`);
            // Filter out customer messages
            const customerMessageCondition = (sender.communicationUserId === this.chatAdapterConfig.id)
            if (customerMessageCondition) {
                return;
            }

            console.log(`[ChatSDKProxy][Event][chatMessageReceived][onNewMessageCallback]`);
            this.debug && console.log(message);
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

    public async listParticipants() {
        const participants = [];
        const pagedAsyncIterableIterator = await this.chatThreadClient.listParticipants();
        let next = await pagedAsyncIterableIterator.next();
        while (!next.done) {
           let user = next.value;
           participants.push(user);
           next = await pagedAsyncIterableIterator.next();
        }
        return participants;
    }

    public isSystemMessage(message: any) {
        console.log(`[ChatSDKProxy][isSystemMessage]`);
        const {sender} = message;
        const {communicationUserId} = sender;

        const participant = this.participantsMapping[communicationUserId];

        console.log(participant);

        if (!participant) {
            return false;
        }

        console.log(participant);

        return participant.displayName === '__system__';
    }

    public isAgentMessage(message: any) {
        const {sender} = message;
        const {communicationUserId} = sender;

        const participant = this.participantsMapping[communicationUserId];

        if (!participant) {
            return false;
        }

        return participant.displayName === '__agent__';
    }

    private createParticipantSMapping(participants: any) {
        this.debug && console.log(`[ChatSDKProxy][createParticipantSMapping]`);
        const mapping: any = {};
        for (const participant of participants) {
            const {user} = participant;
            const {communicationUserId} = user;
            if (!(communicationUserId in mapping)) {
                mapping[communicationUserId] = participant;
            }
        }

        this.participantsMapping = mapping;
    }
}

const createChatSDK = async (omnichannelConfig: any, chatSDKConfig: any = {}) => {
    const chatSDK = new OmnichannelChatSDK(omnichannelConfig, chatSDKConfig);
    await chatSDK.initialize();
    const chatConfig: any = await chatSDK.getLiveChatConfig();

    const {LiveChatVersion: liveChatVersion} = chatConfig;
    // console.log(chatConfig);
    console.log(`[ChatSDKProxy][LiveChatVersion] ${liveChatVersion}`);

    if (liveChatVersion === 1) {
        return chatSDK; // Returns default ChatSDK using IC3
    }

    const chatSDKProxy = new ChatSDKProxy(chatSDK);
    await chatSDKProxy.initialize();
    return chatSDKProxy; // Returns ChatSDKProxy using ACS
}

export default createChatSDK;

