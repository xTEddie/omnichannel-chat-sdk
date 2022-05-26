import LocalTelemetryCollector from "../telemetry/LocalTelemetryCollector";

const getLocalTelemetryCollector = (): LocalTelemetryCollector => {
    return LocalTelemetryCollector.getInstance();
}

export default getLocalTelemetryCollector;