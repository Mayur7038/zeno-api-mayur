"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stock_ledger_entity_1 = require("./entities/stock-ledger.entity");
const stock_transfer_entity_1 = require("./entities/stock-transfer.entity");
const stock_transfer_item_entity_1 = require("./entities/stock-transfer-item.entity");
const stock_adjustment_entity_1 = require("./entities/stock-adjustment.entity");
const stock_adjustment_item_entity_1 = require("./entities/stock-adjustment-item.entity");
const price_list_entity_1 = require("./entities/price-list.entity");
const price_list_item_entity_1 = require("./entities/price-list-item.entity");
const godown_entity_1 = require("../tenancy/entities/godown.entity");
const item_entity_1 = require("../masters/entities/item.entity");
const inventory_service_1 = require("./services/inventory.service");
const stock_transfer_service_1 = require("./services/stock-transfer.service");
const stock_adjustment_service_1 = require("./services/stock-adjustment.service");
const price_list_service_1 = require("./services/price-list.service");
const inventory_controller_1 = require("./controllers/inventory.controller");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                stock_ledger_entity_1.StockLedger,
                stock_transfer_entity_1.StockTransfer,
                stock_transfer_item_entity_1.StockTransferItem,
                stock_adjustment_entity_1.StockAdjustment,
                stock_adjustment_item_entity_1.StockAdjustmentItem,
                price_list_entity_1.PriceList,
                price_list_item_entity_1.PriceListItem,
                godown_entity_1.Godown,
                item_entity_1.Item,
            ]),
        ],
        controllers: [inventory_controller_1.InventoryController],
        providers: [
            inventory_service_1.InventoryService,
            stock_transfer_service_1.StockTransferService,
            stock_adjustment_service_1.StockAdjustmentService,
            price_list_service_1.PriceListService,
        ],
        exports: [
            inventory_service_1.InventoryService,
            stock_transfer_service_1.StockTransferService,
            stock_adjustment_service_1.StockAdjustmentService,
            price_list_service_1.PriceListService,
            typeorm_1.TypeOrmModule,
        ],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map