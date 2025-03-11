// Initialize Inversify container
import { initializeContainer } from "./config/inversify.config";

initializeContainer();

// Export routers
export * from "./routers/report.router";

// Export services interfaces
export * from "./interfaces/services/i-report-service";

// Export repository interfaces
export * from "./interfaces/repositories/i-report-repository";

// Export models
export * from "./models";

// Export the DI container
export { container, TYPES } from "./container";
