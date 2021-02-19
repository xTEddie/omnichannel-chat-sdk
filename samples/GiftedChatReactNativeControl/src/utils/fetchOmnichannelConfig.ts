import { orgId, orgUrl, widgetId, acs_orgId, acs_orgUrl, acs_widgetId } from '@env';

const fetchOmnichannelConfig = (useACS: boolean = false) => {
  const omnichannelConfig = {
    orgId,
    orgUrl,
    widgetId
  }

  if (useACS) {
    omnichannelConfig.orgId = acs_orgId;
    omnichannelConfig.orgUrl = acs_orgUrl;
    omnichannelConfig.widgetId = acs_widgetId;
  }

  return omnichannelConfig;
}

export default fetchOmnichannelConfig;