import "reflect-metadata";

import { Container } from "inversify";

import { db, schema } from "@oppfy/db";

import { IReportRepository } from "./interfaces/repositories/report-repository.interface";
import { IReportService } from "./interfaces/services/report-service.interface";
import { ReportRepository } from "./repositories/report.repository";
import { ReportService } from "./services/report.service";

// Define symbol constants for our interfaces
export const TYPES = {
  // DB Dependencies
  Database: Symbol.for("Database"),
  Schema: Symbol.for("Schema"),

  // Repositories
  ReportRepository: Symbol.for("ReportRepository"),

  // Services
  ReportService: Symbol.for("ReportService"),
};

// Create and configure the container
const container = new Container();

// Bind DB dependencies
container.bind(TYPES.Database).toConstantValue(db);
container.bind(TYPES.Schema).toConstantValue(schema);

// Bind repositories
container.bind<IReportRepository>(TYPES.ReportRepository).to(ReportRepository);

// Bind services
container.bind<IReportService>(TYPES.ReportService).to(ReportService);

export { container };
