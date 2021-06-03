import ChatAdapterConfig from "./ChatAdapterConfig";
import IC3Config from "./IC3Config";

interface IDataMaskingSDKConfig {
    disable: boolean,
    maskingCharacter: string
}

interface TelemetrySDKConfig {
    disable: boolean,
    ariaTelemetryKey?: string
}

interface PersistentChatConfig {
    disable: boolean,
    tokenUpdateTime: number
}

interface IChatSDKConfig {
    dataMasking?: IDataMaskingSDKConfig,
    telemetry?: TelemetrySDKConfig,
    getAuthToken?: () => Promise<string|null>,
    ic3Config?: IC3Config,
    chatAdapterConfig?: ChatAdapterConfig,
    persistentChat?: PersistentChatConfig
}

export {
    IDataMaskingSDKConfig,
    PersistentChatConfig
};

export default IChatSDKConfig;
