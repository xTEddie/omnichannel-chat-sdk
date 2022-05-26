import platform from "../utils/platform";
import WebUtils from "../utils/WebUtils";

class LocalTelemetryCollector {
    private static instance: LocalTelemetryCollector;
    private static debug: boolean;
    private localTelemetryEvents: any;  // eslint-disable-line @typescript-eslint/no-explicit-any

    private constructor() {
        LocalTelemetryCollector.debug = false;
        this.localTelemetryEvents = [];
    }

    public static getInstance(): LocalTelemetryCollector {
        if (!LocalTelemetryCollector.instance) {
            LocalTelemetryCollector.debug && console.log("[LocalTelemetryCollector][New Instance]");
            LocalTelemetryCollector.instance = new LocalTelemetryCollector();
        }

        return LocalTelemetryCollector.instance;
    }

    public setDebug(flag: boolean): void {
        LocalTelemetryCollector.debug = flag;
    }

    public pushTelemetryEvent(event: any): void {  // eslint-disable-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        const metadata = {
            timestampString: new Date(event.timestamp).toUTCString()
        };

        this.localTelemetryEvents.push({...event, ...metadata});
    }

    public dumpLogs(): any {  // eslint-disable-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
        const logs = {
            telemetry: this.localTelemetryEvents
        };

        return logs;
    }

    public webDownloadLogs(): void {
        if (platform.isNode() || platform.isReactNative()) {
            throw Error('Supported on Web only');
        }

        const fileName = `OmnichannelChatSDK - Logs - ${new Date().getTime()}.json`;
        const logs = this.dumpLogs();

        WebUtils.downloadJson(logs, fileName);
    }
}

export default LocalTelemetryCollector;