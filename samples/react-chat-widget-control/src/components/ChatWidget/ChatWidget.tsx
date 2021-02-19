import React, { useEffect, useState } from 'react';
import { Widget, addResponseMessage, isWidgetOpened, dropMessages, addUserMessage } from 'react-chat-widget';
import fetchOmnichannelConfig from '../../utils/fetchOmnichannelConfig';
import {OmnichannelChatSDK, isCustomerMessage, isSystemMessage} from '@microsoft/omnichannel-chat-sdk';
import 'react-chat-widget/lib/styles.css';
import createChatSDK from '../../utils/createChatSDK';

const useACS = false;
const omnichannelConfig: any = fetchOmnichannelConfig();

if (useACS) {
  omnichannelConfig.orgId = '';
  omnichannelConfig.orgUrl = '';
  omnichannelConfig.widgetId = '';
}

console.log(`%c [OmnichannelConfig]`, 'background-color:#001433;color:#fff');
console.log(omnichannelConfig);

function ChatWidget() {
  const [chatSDK, setChatSDK] = useState<OmnichannelChatSDK | any>();
  const [open, setOpen] = useState<boolean>(false);
  const [hasChatStarted, setHasChatStarted] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      if (useACS) {
        const chatSDK = await createChatSDK(omnichannelConfig)
        setChatSDK(chatSDK);

        const liveChatContext = localStorage.getItem('liveChatContext');
        if (liveChatContext && Object.keys(JSON.parse(liveChatContext)).length > 0) {
          console.log("[liveChatContext]");
          console.log(liveChatContext);
        }

        return;
      }

      const chatSDK = new OmnichannelChatSDK(omnichannelConfig);
      await chatSDK.initialize();

      setChatSDK(chatSDK);

      const liveChatContext = localStorage.getItem('liveChatContext');
      if (liveChatContext && Object.keys(JSON.parse(liveChatContext)).length > 0) {
        console.log("[liveChatContext]");
        console.log(liveChatContext);
      }
    }

    init();
  }, []);

  const handleNewUserMessage = async (newMessage: any) => {
    console.log(`New message incoming! ${newMessage}`);

    if (useACS) {
      await chatSDK?.sendMessage({
        content: newMessage
      });
      return;
    }

    await chatSDK?.sendMessage({
      content: newMessage
    });
  };

  const onWidgetClick = async (event: any) => {
    const open = isWidgetOpened();
    // console.log(`[isWidgetOpened] ${open}`);
    setOpen(open);

    if (!hasChatStarted && open) {
      console.log(`[StartChat]`);

      if (useACS) {
        const optionalParams: any = {};

        // Check for active conversation in cache
        const cachedLiveChatContext = localStorage.getItem('liveChatContext');
        if (cachedLiveChatContext && Object.keys(JSON.parse(cachedLiveChatContext)).length > 0) {
          console.log("[liveChatContext]");
          optionalParams.liveChatContext = JSON.parse(cachedLiveChatContext);
        }

        await chatSDK?.startChat(optionalParams);
        const chatToken = await chatSDK?.getChatToken();
        console.log(`[chatToken]`);
        console.log(chatToken);

        const messages = await chatSDK?.getMessages();

        // Rehydrate messages
        for (const message of messages.reverse()) {
          const customerMessageCondition = (message.sender && message.sender.communicationUserId === chatToken.visitorId);
          if (customerMessageCondition) {
            addUserMessage(message.content.message);
          } else {
            addResponseMessage(message.content.message);
          }
        }

        // Cache current conversation context
        const liveChatContext = await chatSDK?.getCurrentLiveChatContext();
        localStorage.setItem('liveChatContext', JSON.stringify(liveChatContext));

        chatSDK?.onNewMessage((message: any) => {
          addResponseMessage(message.content);
        });

        setHasChatStarted(true);
        return;
      }

      const optionalParams: any = {};

      // Check for active conversation in cache
      const cachedLiveChatContext = localStorage.getItem('liveChatContext');
      if (cachedLiveChatContext && Object.keys(JSON.parse(cachedLiveChatContext)).length > 0) {
        console.log("[liveChatContext]");
        optionalParams.liveChatContext = JSON.parse(cachedLiveChatContext);
      }

      await chatSDK?.startChat(optionalParams);

      // Rehydrate messages
      const messages: any = await chatSDK?.getMessages();
      for (const message of messages.reverse()) {
        if (isSystemMessage(message)) {
          addResponseMessage(message.content);
        } else if (isCustomerMessage(message)) {
          addUserMessage(message.content);
        } else {
          addResponseMessage(message.content);
        }
      }

      const chatToken = await chatSDK?.getChatToken();
      console.log(`[chatToken]`);
      console.log(chatToken);

      // Cache current conversation context
      const liveChatContext = await chatSDK?.getCurrentLiveChatContext();
      localStorage.setItem('liveChatContext', JSON.stringify(liveChatContext));

      chatSDK?.onNewMessage((message: any) => {
        addResponseMessage(message.content);
      });

      setHasChatStarted(true);
    }

    if (hasChatStarted && !open) {
      console.log(`[CloseChat]`);

      if (useACS) {
        await chatSDK?.endChat();

        // Clean up
        localStorage.removeItem('liveChatContext');
        dropMessages()
        setHasChatStarted(false);
        return;
      }

      await chatSDK?.endChat();

      // Clean up
      localStorage.removeItem('liveChatContext');
      dropMessages()
      setHasChatStarted(false);
    }
  }

  return (
    <div>
      <h1> Omnichannel Chat SDK </h1>
      <div onClick={onWidgetClick}>
        <Widget
          title='Live Chat'
          subtitle='via omnichannel-sdk & react-chat-widget control'
          handleNewUserMessage={handleNewUserMessage}
        />
      </div>
    </div>
  );
}

export default ChatWidget;
