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
exports.DeliveryChallan = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../../common/enums");
const ledger_entity_1 = require("../../masters/entities/ledger.entity");
const branch_entity_1 = require("../../tenancy/entities/branch.entity");
const godown_entity_1 = require("../../tenancy/entities/godown.entity");
const delivery_challan_item_entity_1 = require("./delivery-challan-item.entity");
const delivery_challan_so_mapping_entity_1 = require("./delivery-challan-so-mapping.entity");
let DeliveryChallan = class DeliveryChallan {
    id;
    tenantId;
    companyId;
    branchId;
    branch;
    godownId;
    godown;
    voucherNo;
    challanDate;
    customerLedgerId;
    customerLedger;
    transportMode;
    vehicleNo;
    eWayBillNo;
    subtotal;
    taxTotal;
    grandTotal;
    status;
    notes;
    createdBy;
    createdAt;
    updatedAt;
    items;
    salesOrders;
};
exports.DeliveryChallan = DeliveryChallan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'company_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], DeliveryChallan.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], DeliveryChallan.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'voucher_no', length: 50 }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "voucherNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'challan_date', type: 'date' }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "challanDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'customer_ledger_id', type: 'uuid' }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "customerLedgerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ledger_entity_1.Ledger, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_ledger_id' }),
    __metadata("design:type", ledger_entity_1.Ledger)
], DeliveryChallan.prototype, "customerLedger", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transport_mode', length: 50, nullable: true }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "transportMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vehicle_no', length: 50, nullable: true }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "vehicleNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'e_way_bill_no', length: 50, nullable: true }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "eWayBillNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallan.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallan.prototype, "taxTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grand_total', type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DeliveryChallan.prototype, "grandTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.DeliveryChallanStatus,
        default: enums_1.DeliveryChallanStatus.PENDING,
    }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DeliveryChallan.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DeliveryChallan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DeliveryChallan.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_challan_item_entity_1.DeliveryChallanItem, (item) => item.deliveryChallan, { cascade: true }),
    __metadata("design:type", Array)
], DeliveryChallan.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_challan_so_mapping_entity_1.DeliveryChallanSoMapping, (mapping) => mapping.deliveryChallan, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], DeliveryChallan.prototype, "salesOrders", void 0);
exports.DeliveryChallan = DeliveryChallan = __decorate([
    (0, typeorm_1.Entity)('delivery_challans'),
    (0, typeorm_1.Unique)(['tenantId', 'companyId', 'branchId', 'voucherNo'])
], DeliveryChallan);
//# sourceMappingURL=delivery-challan.entity.js.map