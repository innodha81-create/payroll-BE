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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardModel = exports.OnboardService = exports.OnboardController = exports.onboardRoutes = void 0;
var onboard_routes_1 = require("./routes/onboard.routes");
Object.defineProperty(exports, "onboardRoutes", { enumerable: true, get: function () { return __importDefault(onboard_routes_1).default; } });
var onboard_controller_1 = require("./controller/onboard.controller");
Object.defineProperty(exports, "OnboardController", { enumerable: true, get: function () { return onboard_controller_1.OnboardController; } });
var onboard_service_1 = require("./service/onboard.service");
Object.defineProperty(exports, "OnboardService", { enumerable: true, get: function () { return onboard_service_1.OnboardService; } });
var onboard_model_1 = require("./model/onboard.model");
Object.defineProperty(exports, "OnboardModel", { enumerable: true, get: function () { return onboard_model_1.OnboardModel; } });
__exportStar(require("./types/onboard.types"), exports);
