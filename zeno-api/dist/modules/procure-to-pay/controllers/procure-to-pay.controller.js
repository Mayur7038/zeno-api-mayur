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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcureToPayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const procure_to_pay_service_1 = require("../services/procure-to-pay.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../auth/entities/user.entity");
const enums_1 = require("../../../common/enums");
let ProcureToPayController = class ProcureToPayController {
    p2pService;
    constructor(p2pService) {
        this.p2pService = p2pService;
    }
    async getPurchaseOrders(tenantId, companyId, status, search) {
        return this.p2pService.getPurchaseOrders(tenantId, companyId, { status, search });
    }
    async getPurchaseOrderById(tenantId, id) {
        return this.p2pService.getPurchaseOrderById(tenantId, id);
    }
    async getVendorPendingOrders(tenantId, vendorId, companyId) {
        return this.p2pService.getVendorPendingPurchaseOrders(tenantId, companyId, vendorId);
    }
    async createPurchaseOrder(tenantId, user, body) {
        return this.p2pService.createPurchaseOrder(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async cancelPurchaseOrder(tenantId, id) {
        return this.p2pService.cancelPurchaseOrder(tenantId, id);
    }
    async getGoodsReceiptNotes(tenantId, companyId, status, search) {
        return this.p2pService.getGoodsReceiptNotes(tenantId, companyId, { status, search });
    }
    async getGoodsReceiptNoteById(tenantId, id) {
        return this.p2pService.getGoodsReceiptNoteById(tenantId, id);
    }
    async getVendorPendingGrns(tenantId, vendorId, companyId) {
        return this.p2pService.getVendorPendingGrns(tenantId, companyId, vendorId);
    }
    async createGoodsReceiptNote(tenantId, user, body) {
        return this.p2pService.createGoodsReceiptNote(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async getPurchaseInvoices(tenantId, companyId, status, search) {
        return this.p2pService.getPurchaseInvoices(tenantId, companyId, { status, search });
    }
    async getPurchaseInvoiceById(tenantId, id) {
        return this.p2pService.getPurchaseInvoiceById(tenantId, id);
    }
    async getVendorPendingInvoices(tenantId, vendorId, companyId) {
        return this.p2pService.getVendorPendingInvoices(tenantId, companyId, vendorId);
    }
    async createPurchaseInvoice(tenantId, user, body) {
        return this.p2pService.createPurchaseInvoice(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async getPurchaseReturns(tenantId, companyId) {
        return this.p2pService.getPurchaseReturns(tenantId, companyId);
    }
    async createPurchaseReturn(tenantId, user, body) {
        return this.p2pService.createPurchaseReturn(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async getVendorPayments(tenantId, companyId) {
        return this.p2pService.getVendorPayments(tenantId, companyId);
    }
    async createVendorPayment(tenantId, user, body) {
        return this.p2pService.createVendorPayment(tenantId, body.companyId, body.branchId, user.id, body);
    }
};
exports.ProcureToPayController = ProcureToPayController;
__decorate([
    (0, common_1.Get)('purchase-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'List purchase orders with status filtering & search' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getPurchaseOrders", null);
__decorate([
    (0, common_1.Get)('purchase-orders/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get purchase order details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getPurchaseOrderById", null);
__decorate([
    (0, common_1.Get)('vendor/:vendorId/pending-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending POs for a vendor (auto-pulled into GRN modal)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('vendorId')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getVendorPendingOrders", null);
__decorate([
    (0, common_1.Post)('purchase-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Create purchase order' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Put)('purchase-orders/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel purchase order (enforces no linked GRN)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "cancelPurchaseOrder", null);
__decorate([
    (0, common_1.Get)('goods-receipt-notes'),
    (0, swagger_1.ApiOperation)({ summary: 'List GRNs with status filtering' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getGoodsReceiptNotes", null);
__decorate([
    (0, common_1.Get)('goods-receipt-notes/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get GRN details with line items and stock location' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getGoodsReceiptNoteById", null);
__decorate([
    (0, common_1.Get)('vendor/:vendorId/pending-grns'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending GRNs for a vendor (auto-pulled into Purchase Invoice modal)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('vendorId')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getVendorPendingGrns", null);
__decorate([
    (0, common_1.Post)('goods-receipt-notes'),
    (0, swagger_1.ApiOperation)({ summary: 'Create GRN and post stock IN to godown/rack' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "createGoodsReceiptNote", null);
__decorate([
    (0, common_1.Get)('purchase-invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'List purchase invoices with payment status' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getPurchaseInvoices", null);
__decorate([
    (0, common_1.Get)('purchase-invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get purchase invoice details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getPurchaseInvoiceById", null);
__decorate([
    (0, common_1.Get)('vendor/:vendorId/pending-invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unpaid/partially paid bills for vendor payment allocation' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('vendorId')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getVendorPendingInvoices", null);
__decorate([
    (0, common_1.Post)('purchase-invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Create purchase invoice with double-entry and stock posting' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "createPurchaseInvoice", null);
__decorate([
    (0, common_1.Get)('purchase-returns'),
    (0, swagger_1.ApiOperation)({ summary: 'List purchase returns' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getPurchaseReturns", null);
__decorate([
    (0, common_1.Post)('purchase-returns'),
    (0, swagger_1.ApiOperation)({ summary: 'Create purchase return with stock out and accounting reversal' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "createPurchaseReturn", null);
__decorate([
    (0, common_1.Get)('vendor-payments'),
    (0, swagger_1.ApiOperation)({ summary: 'List vendor payments' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "getVendorPayments", null);
__decorate([
    (0, common_1.Post)('vendor-payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Create vendor payment and allocate to pending bills' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], ProcureToPayController.prototype, "createVendorPayment", null);
exports.ProcureToPayController = ProcureToPayController = __decorate([
    (0, swagger_1.ApiTags)('Procure-to-Pay (PO, GRN, Purchase Invoice, Return, Payment)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('procure-to-pay'),
    __metadata("design:paramtypes", [procure_to_pay_service_1.ProcureToPayService])
], ProcureToPayController);
//# sourceMappingURL=procure-to-pay.controller.js.map