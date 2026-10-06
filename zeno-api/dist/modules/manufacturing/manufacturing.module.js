"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bom_entity_1 = require("./entities/bom.entity");
const bom_item_entity_1 = require("./entities/bom-item.entity");
const production_entry_entity_1 = require("./entities/production-entry.entity");
const production_item_entity_1 = require("./entities/production-item.entity");
const stock_ledger_entity_1 = require("../inventory/entities/stock-ledger.entity");
const item_entity_1 = require("../masters/entities/item.entity");
const manufacturing_service_1 = require("./services/manufacturing.service");
const manufacturing_controller_1 = require("./controllers/manufacturing.controller");
let ManufacturingModule = class ManufacturingModule {
};
exports.ManufacturingModule = ManufacturingModule;
exports.ManufacturingModule = ManufacturingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                bom_entity_1.BillOfMaterials,
                bom_item_entity_1.BomItem,
                production_entry_entity_1.ProductionEntry,
                production_item_entity_1.ProductionItem,
                stock_ledger_entity_1.StockLedger,
                item_entity_1.Item,
            ]),
        ],
        controllers: [manufacturing_controller_1.ManufacturingController],
        providers: [manufacturing_service_1.ManufacturingService],
        exports: [manufacturing_service_1.ManufacturingService],
    })
], ManufacturingModule);
//# sourceMappingURL=manufacturing.module.js.map