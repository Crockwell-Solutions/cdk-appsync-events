import output from './cdk-output.json'

interface CdkOutput {
  AirspaceAlerterStatelessStack?: {
    restApiUrl?: string;
    restApiKey?: string;
    eventsUrl?: string;
    eventsApiKey?: string;
    eventsHttpDomain?: string;
  };
}

interface AppConfig {
  restApiUrl: string;
  restApiKey: string;
  eventsUrl: string;
  eventsApiKey: string;
  eventsHttpDomain: string;
}

let config: AppConfig | null = null;

export const loadConfig = async (): Promise<AppConfig | null> => {
  if (config) return config;

  try {
    const cdkOutput: CdkOutput = output;
    const stackOutput = cdkOutput.AirspaceAlerterStatelessStack;

    if (!stackOutput?.restApiUrl || !stackOutput?.restApiKey || !stackOutput?.eventsUrl || !stackOutput?.eventsApiKey || !stackOutput?.eventsHttpDomain) {
      return null;
    }

    config = {
      restApiUrl: stackOutput.restApiUrl,
      restApiKey: stackOutput.restApiKey,
      eventsUrl: stackOutput.eventsUrl,
      eventsApiKey: stackOutput.eventsApiKey,
      eventsHttpDomain: stackOutput.eventsHttpDomain,
    };

    return config;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
};

export const getConfig = (): AppConfig | null => config;
