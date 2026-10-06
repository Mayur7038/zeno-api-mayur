"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceList = exports.PricingDimension = void 0;
const typeorm_1 = require("typeorm");
const item_group_entity_1 = require("../../masters/entities/item-group.entity");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
const price_list_item_entity_1 = require("./price-list-item.entity");
var PricingDimension;
(function (PricingDimension) {
    PricingDimension["STOCK_GROUP_WISE"] = "STOCK_GROUP_WISE";
    PricingDimension["CUSTOMER_WISE"] = "CUSTOMER_WISE";
    PricingDimension["PRODUCT_WISE"] = "PRODUCT_WISE";
})(PricingDimension || (exports.PricingDimension = PricingDimension = {}));
let PriceList = class PriceList {
    id;
    tenantId;
    companyId;
    name;
    code;
    pricingType;
    effectiveFrom;
    effectiveTo;
    itemGroupId;
    itemGroup;
    customerId;
    customer;
    itemId;
    item;
    discountPercentage;
    marginPercentage;
    currency;
    isActive;
    notes;
    items;
    createdAt;
    updatedAt;
};
exports.PriceList = PriceList;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PriceList.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], PriceList.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], PriceList.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], PriceList.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], PriceList.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        name: 'pricing_type',
        type: 'enum',
        enum: PricingDimension,
        default: PricingDimension.PRODUCT_WISE,
    }),
    __metadata("design:type", String)
], PriceList.prototype, "pricingType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'effective_from', type: 'date' }),
    __metadata("design:type", String)
], PriceList.prototype, "effectiveFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'effective_to', type: 'date', nullable: true }),
    __metadata("design:type", String)
], PriceList.prototype, "effectiveTo", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_group_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PriceList.prototype, "itemGroupId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_group_entity_1.ItemGroup, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_group_id' }),
    __metadata("design:type", item_group_entity_1.ItemGroup)
], PriceList.prototype, "itemGroup", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'customer_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PriceList.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], PriceList.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'item_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PriceList.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_entity_1.Item, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", item_entity_1.Item)
], PriceList.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PriceList.prototype, "discountPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'margin_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PriceList.prototype, "marginPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'INR' }),
    __metadata("design:type", String)
], PriceList.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], PriceList.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PriceList.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => price_list_item_entity_1.PriceListItem, (item) => item.priceList, { cascade: true }),
    __metadata("design:type", Array)
], PriceList.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PriceList.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PriceList.prototype, "updatedAt", void 0);
exports.PriceList = PriceList = __decorate([
    (0, typeorm_1.Entity)('price_lists')
], PriceList);
//# sourceMappingURL=price-list.entity.js.map