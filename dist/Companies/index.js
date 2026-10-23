"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModel = exports.CompanyService = exports.CompanyController = exports.companyRoutes = void 0;
var company_routes_1 = require("./routes/company.routes");
Object.defineProperty(exports, "companyRoutes", { enumerable: true, get: function () { return company_routes_1.companyRoutes; } });
var company_controller_1 = require("./controller/company.controller");
Object.defineProperty(exports, "CompanyController", { enumerable: true, get: function () { return company_controller_1.CompanyController; } });
var company_service_1 = require("./service/company.service");
Object.defineProperty(exports, "CompanyService", { enumerable: true, get: function () { return company_service_1.CompanyService; } });
var company_model_1 = require("./model/company.model");
Object.defineProperty(exports, "CompanyModel", { enumerable: true, get: function () { return company_model_1.CompanyModel; } });
__exportStar(require("./types/company.types"), exports);
