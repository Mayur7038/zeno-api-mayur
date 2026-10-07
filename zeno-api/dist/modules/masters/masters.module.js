"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MastersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ledger_group_entity_1 = require("./entities/ledger-group.entity");
const ledger_entity_1 = require("./entities/ledger.entity");
const unit_entity_1 = require("./entities/unit.entity");
const item_group_entity_1 = require("./entities/item-group.entity");
const item_category_entity_1 = require("./entities/item-category.entity");
const item_entity_1 = require("./entities/item.entity");
const item_variant_entity_1 = require("./entities/item-variant.entity");
const variant_definition_entity_1 = require("./entities/variant-definition.entity");
const masters_service_1 = require("./services/masters.service");
const masters_controller_1 = require("./controllers/masters.controller");
let MastersModule = class MastersModule {
};
exports.MastersModule = MastersModule;
exports.MastersModule = MastersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                ledger_group_entity_1.LedgerGroup,
                ledger_entity_1.Ledger,
                unit_entity_1.Unit,
                item_group_entity_1.ItemGroup,
                item_category_entity_1.ItemCategory,
                item_entity_1.Item,
                item_variant_entity_1.ItemVariant,
                variant_definition_entity_1.VariantDefinition,
            ]),
        ],
        controllers: [masters_controller_1.MastersController],
        providers: [masters_service_1.MastersService],
        exports: [masters_service_1.MastersService, typeorm_1.TypeOrmModule],
    })
], MastersModule);
//# sourceMappingURL=masters.module.js.map