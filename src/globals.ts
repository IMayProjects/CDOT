class ConfigService {
  private static instance: ConfigService;

  private customerId: string | null = null;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  retrieveCustomerId(): string {
    if (!this.customerId) {
      const id =
        PropertiesService.getScriptProperties().getProperty("CustomerID");
      if (!id) {
        throw new Error(
          "[ConfigError] 'CustomerID' is not defined in Script Properties.",
        );
      }
      this.customerId = id;
    }
    return this.customerId;
  }
}

export const Globals = ConfigService.getInstance();
