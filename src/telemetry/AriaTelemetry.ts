import { ariaTelemetryKey } from '../config/settings';
import { AWTEventPriority } from '../external/aria/common/Enums';
import { AWTLogManager, AWTLogger, AWTEventData } from '../external/aria/webjs/AriaSDK';
import LogLevel from '../telemetry/LogLevel';
import ScenarioType from '../telemetry/ScenarioType';
import { ic3ClientVersion, webChatACSAdapterVersion } from '../config/settings';
import { isBrowser, isReactNative } from '../utils/platform';
import getLocalTelemetryCollector from '../utils/getLocalTelemetryCollector';
import LocalTelemetryCollector from './LocalTelemetryCollector';

interface BaseContract {
    ChatSDKRuntimeId: string;
    OrgId: string;
    OrgUrl: string;
    WidgetId: string;
    RequestId?: string;
    ChatId?: string;
    CallId?: string;
    Domain?: string;
    ExceptionDetails?: string;
    ElapsedTimeInMilliseconds?: string;
    ChatSDKVersion: string;
    NPMPackagesInfo?: string;
    CDNPackagesInfo?: string;
    PlatformDetails?: string;
}

interface NPMPackagesInfo {
    OCSDK: string;
    IC3Core?: string;
    ACSChat?: string;
    ACSCommon?: string;
    AMSClient?: string;
}

interface CDNPackagesInfo {
    IC3Client?: string;
    IC3Adapter?: string;
    ACSAdapter?: string;
    SpoolSDK?: string;
    VoiceVideoCalling?: string;
}

interface IC3ClientContract {
    ChatSDKRuntimeId: string;
    OrgId: string;
    OrgUrl: string;
    WidgetId: string;
    RequestId: string;
    ChatId: string;
    Event?: string;
    Description?: string;
    SubscriptionId?: string;
    EndpointId?: string;
    EndpointUrl?: string;
    ErrorCode?: string;
    ExceptionDetails?: string;
    ElapsedTimeInMilliseconds?: string;
    IC3ClientVersion: string;
}

interface OCSDKContract {
    ChatSDKRuntimeId: string;
    OrgId: string;
    OrgUrl: string;
    WidgetId: string;
    RequestId: string;
    ChatId: string;
    TransactionId: string;
    Event?: string;
    ExceptionDetails?: string;
    ElapsedTimeInMilliseconds?: string;
    OCSDKVersion: string;
}

interface ACSClientContract {
    ChatSDKRuntimeId: string;
    OrgId: string;
    OrgUrl: string;
    WidgetId: string;
    RequestId?: string;
    ChatId?: string;
    Event?: string;
    ExceptionDetails?: string;
    ElapsedTimeInMilliseconds?: string;
    ACSChatVersion: string;
}

interface ACSAdapterContract {
    ChatSDKRuntimeId: string;
    OrgId: string;
    OrgUrl: string;
    WidgetId: string;
    RequestId?: string;
    ChatId?: string;
    Event?: string;
    ExceptionDetails?: string;
    ElapsedTimeInMilliseconds?: string;
    ACSAdapterVersion: string;
}

interface CallingSDKContract {
    ChatSDKRuntimeId: string;
    OrgId: string;
    OrgUrl: string;
    WidgetId: string;
    RequestId?: string;
    ChatId?: string;
    CallId?: string;
    Event?: string;
    Description?: string;
    ExceptionDetails?: string;
    ElapsedTimeInMilliseconds?: string;
}

enum Renderer {
    ReactNative = 'ReactNative'
}

class AriaTelemetry {
    private static _logger: AWTLogger;
    private static _debug = false;
    private static _CDNPackagesInfo: CDNPackagesInfo;
    private static _disable = false;
    private static _localTelemetryCollector: LocalTelemetryCollector = getLocalTelemetryCollector();

    public static initialize(key: string): void {
        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][logger][initialize][custom]`);
        AriaTelemetry._logger = AWTLogManager.initialize(key);
    }

    /* istanbul ignore next */
    public static setDebug(flag: boolean): void {
        AriaTelemetry._debug = flag;
    }

    public static disable(): void {
        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][disable]`);
        AriaTelemetry._disable = true;
    }

    public static setCDNPackages(packages: CDNPackagesInfo): void {
        AriaTelemetry._CDNPackagesInfo = {
            ...AriaTelemetry._CDNPackagesInfo,
            ...packages
        };
    }

    public static info(properties: AWTEventData["properties"], scenarioType: ScenarioType = ScenarioType.EVENTS): void {
        let event = {
            name: ScenarioType.EVENTS,
            properties: {
                ...AriaTelemetry.populateBaseProperties(),
                ...AriaTelemetry.fillWebPlatformData(),
                ...AriaTelemetry.fillMobilePlatformData(),
                ...properties,
                LogLevel: LogLevel.INFO
            },
            priority: AWTEventPriority.High
        };

        if (scenarioType == ScenarioType.IC3CLIENT) {
            event = {
                name: ScenarioType.IC3CLIENT,
                properties: {
                    ...AriaTelemetry.populateIC3ClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.INFO
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.OCSDK) {
            event = {
                name: ScenarioType.OCSDK,
                properties: {
                    ...AriaTelemetry.populateOCSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.INFO
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSCLIENT) {
            event = {
                name: ScenarioType.ACSCLIENT,
                properties: {
                    ...AriaTelemetry.populateACSClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.INFO
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSADAPTER) {
            event = {
                name: ScenarioType.ACSADAPTER,
                properties: {
                    ...AriaTelemetry.populateACSAdapterBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.INFO
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.CALLINGSDK) {
            event = {
                name: ScenarioType.CALLINGSDK,
                properties: {
                    ...AriaTelemetry.populateCallingSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.INFO
                },
                priority: AWTEventPriority.High
            }
        }

        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][info] ${scenarioType}`);
        /* istanbul ignore next */
        this._debug && console.log(event);
        /* istanbul ignore next */
        this._debug && console.log(event.properties.Event);

        !AriaTelemetry._disable && AriaTelemetry.logger?.logEvent(event);
        AriaTelemetry._localTelemetryCollector.pushTelemetryEvent(event);
    }

    public static debug(properties: AWTEventData["properties"], scenarioType: ScenarioType = ScenarioType.EVENTS): void {
        let event = {
            name: ScenarioType.EVENTS,
            properties: {
                ...AriaTelemetry.populateBaseProperties(),
                ...AriaTelemetry.fillWebPlatformData(),
                ...AriaTelemetry.fillMobilePlatformData(),
                ...properties,
                LogLevel: LogLevel.DEBUG
            },
            priority: AWTEventPriority.High
        };

        if (scenarioType == ScenarioType.IC3CLIENT) {
            event = {
                name: ScenarioType.IC3CLIENT,
                properties: {
                    ...AriaTelemetry.populateIC3ClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.DEBUG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.OCSDK) {
            event = {
                name: ScenarioType.OCSDK,
                properties: {
                    ...AriaTelemetry.populateOCSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.DEBUG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSCLIENT) {
            event = {
                name: ScenarioType.ACSCLIENT,
                properties: {
                    ...AriaTelemetry.populateACSClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.DEBUG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSADAPTER) {
            event = {
                name: ScenarioType.ACSADAPTER,
                properties: {
                    ...AriaTelemetry.populateACSAdapterBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.DEBUG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.CALLINGSDK) {
            event = {
                name: ScenarioType.CALLINGSDK,
                properties: {
                    ...AriaTelemetry.populateCallingSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.DEBUG
                },
                priority: AWTEventPriority.High
            }
        }

        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][debug] ${scenarioType}`);
        /* istanbul ignore next */
        this._debug && console.log(event);
        /* istanbul ignore next */
        this._debug && console.log(event.properties.Event);

        !AriaTelemetry._disable && AriaTelemetry.logger?.logEvent(event);
        AriaTelemetry._localTelemetryCollector.pushTelemetryEvent(event);
    }

    public static warn(properties: AWTEventData["properties"], scenarioType: ScenarioType = ScenarioType.EVENTS): void {
        let event = {
            name: ScenarioType.EVENTS,
            properties: {
                ...AriaTelemetry.populateBaseProperties(),
                ...AriaTelemetry.fillWebPlatformData(),
                ...AriaTelemetry.fillMobilePlatformData(),
                ...properties,
                LogLevel: LogLevel.WARN,
            },
            priority: AWTEventPriority.High
        };

        if (scenarioType == ScenarioType.IC3CLIENT) {
            event = {
                name: ScenarioType.IC3CLIENT,
                properties: {
                    ...AriaTelemetry.populateIC3ClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.WARN
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.OCSDK) {
            event = {
                name: ScenarioType.OCSDK,
                properties: {
                    ...AriaTelemetry.populateOCSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.WARN
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSCLIENT) {
            event = {
                name: ScenarioType.ACSCLIENT,
                properties: {
                    ...AriaTelemetry.populateACSClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.WARN
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSADAPTER) {
            event = {
                name: ScenarioType.ACSADAPTER,
                properties: {
                    ...AriaTelemetry.populateACSAdapterBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.WARN
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.CALLINGSDK) {
            event = {
                name: ScenarioType.CALLINGSDK,
                properties: {
                    ...AriaTelemetry.populateCallingSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.WARN
                },
                priority: AWTEventPriority.High
            }
        }

        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][warn] ${scenarioType}`);
        /* istanbul ignore next */
        this._debug && console.log(event);
        /* istanbul ignore next */
        this._debug && console.log(event.properties.Event);

        !AriaTelemetry._disable && AriaTelemetry.logger?.logEvent(event);
        AriaTelemetry._localTelemetryCollector.pushTelemetryEvent(event);
    }

    public static error(properties: AWTEventData["properties"], scenarioType: ScenarioType = ScenarioType.EVENTS): void {
        let event = {
            name: ScenarioType.EVENTS,
            properties: {
                ...AriaTelemetry.populateBaseProperties(),
                ...AriaTelemetry.fillWebPlatformData(),
                ...AriaTelemetry.fillMobilePlatformData(),
                ...properties,
                LogLevel: LogLevel.ERROR
            },
            priority: AWTEventPriority.High
        };

        if (scenarioType == ScenarioType.IC3CLIENT) {
            event = {
                name: ScenarioType.IC3CLIENT,
                properties: {
                    ...AriaTelemetry.populateIC3ClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.ERROR
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.OCSDK) {
            event = {
                name: ScenarioType.OCSDK,
                properties: {
                    ...AriaTelemetry.populateOCSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.ERROR
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSCLIENT) {
            event = {
                name: ScenarioType.ACSCLIENT,
                properties: {
                    ...AriaTelemetry.populateACSClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.ERROR
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSADAPTER) {
            event = {
                name: ScenarioType.ACSADAPTER,
                properties: {
                    ...AriaTelemetry.populateACSAdapterBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.ERROR
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.CALLINGSDK) {
            event = {
                name: ScenarioType.CALLINGSDK,
                properties: {
                    ...AriaTelemetry.populateCallingSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.ERROR
                },
                priority: AWTEventPriority.High
            }
        }

        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][error] ${scenarioType}`);
        /* istanbul ignore next */
        this._debug && console.log(event);
        /* istanbul ignore next */
        this._debug && console.log(event.properties.Event);

        !AriaTelemetry._disable && AriaTelemetry.logger?.logEvent(event);
        AriaTelemetry._localTelemetryCollector.pushTelemetryEvent(event);
    }

    public static log(properties: AWTEventData["properties"], scenarioType: ScenarioType = ScenarioType.EVENTS): void {
        let event = {
            name: ScenarioType.EVENTS,
            properties: {
                ...AriaTelemetry.populateBaseProperties(),
                ...AriaTelemetry.fillWebPlatformData(),
                ...AriaTelemetry.fillMobilePlatformData(),
                ...properties,
                LogLevel: LogLevel.LOG
            },
            priority: AWTEventPriority.High
        };

        if (scenarioType == ScenarioType.IC3CLIENT) {
            event = {
                name: ScenarioType.IC3CLIENT,
                properties: {
                    ...AriaTelemetry.populateIC3ClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.LOG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.OCSDK) {
            event = {
                name: ScenarioType.OCSDK,
                properties: {
                    ...AriaTelemetry.populateOCSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.LOG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSCLIENT) {
            event = {
                name: ScenarioType.ACSCLIENT,
                properties: {
                    ...AriaTelemetry.populateACSClientBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.LOG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.ACSADAPTER) {
            event = {
                name: ScenarioType.ACSADAPTER,
                properties: {
                    ...AriaTelemetry.populateACSAdapterBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.LOG
                },
                priority: AWTEventPriority.High
            }
        }

        if (scenarioType == ScenarioType.CALLINGSDK) {
            event = {
                name: ScenarioType.CALLINGSDK,
                properties: {
                    ...AriaTelemetry.populateCallingSDKBaseProperties(),
                    ...properties,
                    LogLevel: LogLevel.LOG
                },
                priority: AWTEventPriority.High
            }
        }

        /* istanbul ignore next */
        this._debug && console.log(`[AriaTelemetry][log]`);
        /* istanbul ignore next */
        this._debug && console.log(event);
        /* istanbul ignore next */
        this._debug && console.log(event.properties.Event);

        !AriaTelemetry._disable && AriaTelemetry.logger?.logEvent(event);
        AriaTelemetry._localTelemetryCollector.pushTelemetryEvent(event);
    }

    private static get logger(): AWTLogger {
        if (!AriaTelemetry._logger) {
            /* istanbul ignore next */
            this._debug && console.log(`[AriaTelemetry][logger][initialize]`);
            AriaTelemetry._logger = AWTLogManager.initialize(ariaTelemetryKey);
        }
        return AriaTelemetry._logger;
    }

    private static populateBaseProperties(): BaseContract {
        const packagesInfo: NPMPackagesInfo = {
            OCSDK: require('@microsoft/ocsdk/package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
            IC3Core: require('@microsoft/omnichannel-ic3core/package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
            ACSChat: require('@azure/communication-chat/package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
            ACSCommon: require('@azure/communication-common/package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
            AMSClient:  require('@microsoft/omnichannel-amsclient/package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
        };

        return {
            ChatSDKRuntimeId: '',
            OrgId: '',
            OrgUrl: '',
            WidgetId: '',
            RequestId: '',
            ChatId: '',
            CallId: '',
            Domain: '',
            ExceptionDetails: '',
            ElapsedTimeInMilliseconds: '',
            ChatSDKVersion: require('../../package.json').version, // eslint-disable-line @typescript-eslint/no-var-requires
            NPMPackagesInfo: JSON.stringify(packagesInfo),
            CDNPackagesInfo: JSON.stringify(AriaTelemetry._CDNPackagesInfo),
            PlatformDetails: ''
        };
    }

    private static fillMobilePlatformData() {
        const platformData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        const platformDetails: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!isReactNative()) {
            return platformData;
        }

        try {
            const ReactNative = require('react-native'); // eslint-disable-line @typescript-eslint/no-var-requires
            const Platform = ReactNative.Platform;

            platformDetails.Renderer = Renderer.ReactNative;

            platformData.DeviceInfo_OsVersion = Platform.Version;
            platformDetails.DeviceInfo_OsVersion = Platform.Version;

            if (Platform.OS.toLowerCase() === 'android') {
                platformData.DeviceInfo_OsName = 'Android';
                platformDetails.DeviceInfo_OsName = 'Android'
            } else if (Platform.OS.toLowerCase() === 'ios') {
                platformData.DeviceInfo_OsName = 'iOS';
                platformDetails.DeviceInfo_OsName = 'iOS'
            } else {
                platformData.DeviceInfo_OsName = `${Platform.OS}`;
                platformDetails.DeviceInfo_OsName = `${Platform.OS}`;
            }

            /* istanbul ignore next */
            this._debug && console.log(`[AriaTelemetry][fillMobilePlatformData][${platformData.DeviceInfo_OsName}]`);
        } catch {
            /* istanbul ignore next */
            this._debug && console.log("[AriaTelemetry][fillMobilePlatformData][Web]");
        }

        platformData.PlatformDetails = JSON.stringify(platformDetails); // Fallback if unable to overwrite Aria's default properties
        return platformData;
    }

    private static fillWebPlatformData() {
        const platformData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!isBrowser()) {
            return platformData;
        }

        try {
            platformData.Domain = window.location.origin || '';

            /* istanbul ignore next */
            this._debug && console.log(`[AriaTelemetry][fillWebPlatformData]`);
        } catch {
            /* istanbul ignore next */
            this._debug && console.log("[AriaTelemetry][fillWebPlatformData][Error]");
        }

        return platformData;
    }

    private static populateIC3ClientBaseProperties(): IC3ClientContract {
        return {
            ChatSDKRuntimeId: '',
            OrgId: '',
            OrgUrl: '',
            WidgetId: '',
            RequestId: '',
            ChatId: '',
            Event: '',
            Description: '',
            SubscriptionId: '',
            EndpointId: '',
            EndpointUrl: '',
            ErrorCode: '',
            ExceptionDetails: '',
            ElapsedTimeInMilliseconds: '',
            IC3ClientVersion: ic3ClientVersion
        }
    }

    private static populateOCSDKBaseProperties(): OCSDKContract {
        return {
            ChatSDKRuntimeId: '',
            OrgId: '',
            OrgUrl: '',
            WidgetId: '',
            RequestId: '',
            ChatId: '',
            TransactionId: '',
            Event: '',
            ExceptionDetails: '',
            ElapsedTimeInMilliseconds: '',
            OCSDKVersion: require('@microsoft/ocsdk/package.json').version // eslint-disable-line @typescript-eslint/no-var-requires
        }
    }

    private static populateACSClientBaseProperties(): ACSClientContract {
        return {
            ChatSDKRuntimeId: '',
            OrgId: '',
            OrgUrl: '',
            WidgetId: '',
            RequestId: '',
            ChatId: '',
            Event: '',
            ExceptionDetails: '',
            ElapsedTimeInMilliseconds: '',
            ACSChatVersion: require('@azure/communication-chat/package.json').version // eslint-disable-line @typescript-eslint/no-var-requires
        }
    }

    private static populateACSAdapterBaseProperties(): ACSAdapterContract {
        return {
            ChatSDKRuntimeId: '',
            OrgId: '',
            OrgUrl: '',
            WidgetId: '',
            RequestId: '',
            ChatId: '',
            Event: '',
            ExceptionDetails: '',
            ElapsedTimeInMilliseconds: '',
            ACSAdapterVersion: webChatACSAdapterVersion
        }
    }

    private static populateCallingSDKBaseProperties(): CallingSDKContract {
        return {
            ChatSDKRuntimeId: '',
            OrgId: '',
            OrgUrl: '',
            WidgetId: '',
            RequestId: '',
            ChatId: '',
            CallId: '',
            Event: '',
            Description: '',
            ExceptionDetails: '',
            ElapsedTimeInMilliseconds: ''
        }
    }
}

export default AriaTelemetry;