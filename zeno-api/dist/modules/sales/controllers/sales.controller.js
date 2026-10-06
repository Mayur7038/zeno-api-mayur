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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sales_service_1 = require("../services/sales.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../../common/guards/tenant.guard");
const current_tenant_decorator_1 = require("../../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../auth/entities/user.entity");
const enums_1 = require("../../../common/enums");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    async getSalesOrders(tenantId, companyId, status, search) {
        return this.salesService.getSalesOrders(tenantId, companyId, { status, search });
    }
    async getSalesOrderById(tenantId, id) {
        return this.salesService.getSalesOrderById(tenantId, id);
    }
    async getCustomerPendingSalesOrders(tenantId, customerId, companyId) {
        return this.salesService.getCustomerPendingSalesOrders(tenantId, companyId, customerId);
    }
    async createSalesOrder(tenantId, user, body) {
        return this.salesService.createSalesOrder(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async cancelSalesOrder(tenantId, id) {
        return this.salesService.cancelSalesOrder(tenantId, id);
    }
    async getDeliveryChallans(tenantId, companyId, status, search) {
        return this.salesService.getDeliveryChallans(tenantId, companyId, { status, search });
    }
    async getDeliveryChallanById(tenantId, id) {
        return this.salesService.getDeliveryChallanById(tenantId, id);
    }
    async getCustomerPendingChallans(tenantId, customerId, companyId) {
        return this.salesService.getCustomerPendingChallans(tenantId, companyId, customerId);
    }
    async createDeliveryChallan(tenantId, user, body) {
        return this.salesService.createDeliveryChallan(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async getSalesInvoices(tenantId, companyId, status, search) {
        return this.salesService.getSalesInvoices(tenantId, companyId, { status, search });
    }
    async getSalesInvoiceById(tenantId, id) {
        return this.salesService.getSalesInvoiceById(tenantId, id);
    }
    async getCustomerPendingInvoices(tenantId, customerId, companyId) {
        return this.salesService.getCustomerPendingInvoices(tenantId, companyId, customerId);
    }
    async createSalesInvoice(tenantId, user, body) {
        return this.salesService.createSalesInvoice(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async getSalesReturns(tenantId, companyId) {
        return this.salesService.getSalesReturns(tenantId, companyId);
    }
    async createSalesReturn(tenantId, user, body) {
        return this.salesService.createSalesReturn(tenantId, body.companyId, body.branchId, user.id, body);
    }
    async getCustomerReceipts(tenantId, companyId) {
        return this.salesService.getCustomerReceipts(tenantId, companyId);
    }
    async createCustomerReceipt(tenantId, user, body) {
        return this.salesService.createCustomerReceipt(tenantId, body.companyId, body.branchId, user.id, body);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Get)('sales-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'List sales orders with status/search filters' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getSalesOrders", null);
__decorate([
    (0, common_1.Get)('sales-orders/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sales order details with line items' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getSalesOrderById", null);
__decorate([
    (0, common_1.Get)('customer/:customerId/pending-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending sales orders for customer' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getCustomerPendingSalesOrders", null);
__decorate([
    (0, common_1.Post)('sales-orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new sales order' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "createSalesOrder", null);
__decorate([
    (0, common_1.Put)('sales-orders/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel un-dispatched sales order' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "cancelSalesOrder", null);
__decorate([
    (0, common_1.Get)('delivery-challans'),
    (0, swagger_1.ApiOperation)({ summary: 'List delivery challans' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getDeliveryChallans", null);
__decorate([
    (0, common_1.Get)('delivery-challans/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get delivery challan details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getDeliveryChallanById", null);
__decorate([
    (0, common_1.Get)('customer/:customerId/pending-challans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending delivery challans for customer billing' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getCustomerPendingChallans", null);
__decorate([
    (0, common_1.Post)('delivery-challans'),
    (0, swagger_1.ApiOperation)({ summary: 'Create delivery challan with atomic Stock OUT' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "createDeliveryChallan", null);
__decorate([
    (0, common_1.Get)('sales-invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'List sales tax invoices' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getSalesInvoices", null);
__decorate([
    (0, common_1.Get)('sales-invoices/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sales invoice details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getSalesInvoiceById", null);
__decorate([
    (0, common_1.Get)('customer/:customerId/pending-invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get unpaid/pending sales invoices for customer receipt allocation' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('customerId')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getCustomerPendingInvoices", null);
__decorate([
    (0, common_1.Post)('sales-invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate sales tax invoice with balanced double-entry revenue posting' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "createSalesInvoice", null);
__decorate([
    (0, common_1.Get)('sales-returns'),
    (0, swagger_1.ApiOperation)({ summary: 'List sales returns / credit notes' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getSalesReturns", null);
__decorate([
    (0, common_1.Post)('sales-returns'),
    (0, swagger_1.ApiOperation)({ summary: 'Create sales return with Stock IN and accounting credit reversal' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "createSalesReturn", null);
__decorate([
    (0, common_1.Get)('customer-receipts'),
    (0, swagger_1.ApiOperation)({ summary: 'List customer receipt vouchers' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getCustomerReceipts", null);
__decorate([
    (0, common_1.Post)('customer-receipts'),
    (0, swagger_1.ApiOperation)({ summary: 'Post customer payment receipt with invoice allocation and Dr Bank/Cash Cr Customer' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "createCustomerReceipt", null);
exports.SalesController = SalesController = __decorate([
    (0, swagger_1.ApiTags)('Order-to-Cash (Sales & Billing)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map