"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpPurpose = exports.FeatureKey = exports.VoucherType = exports.SalesInvoiceStatus = exports.DeliveryChallanStatus = exports.SalesOrderStatus = exports.PurchaseInvoiceStatus = exports.GrnStatus = exports.PurchaseOrderStatus = exports.PurchaseType = exports.BalanceType = exports.LedgerGroupNature = exports.GstActiveLevel = exports.PermissionModule = exports.PermissionAction = exports.RoleType = void 0;
var RoleType;
(function (RoleType) {
    RoleType["SUPER_ADMIN"] = "SUPER_ADMIN";
    RoleType["ADMIN"] = "ADMIN";
    RoleType["ACCOUNTANT"] = "ACCOUNTANT";
    RoleType["PURCHASE_MANAGER"] = "PURCHASE_MANAGER";
    RoleType["STORE_KEEPER"] = "STORE_KEEPER";
    RoleType["VIEWER"] = "VIEWER";
})(RoleType || (exports.RoleType = RoleType = {}));
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["VIEW"] = "VIEW";
    PermissionAction["CREATE"] = "CREATE";
    PermissionAction["EDIT"] = "EDIT";
    PermissionAction["DELETE"] = "DELETE";
    PermissionAction["PRINT"] = "PRINT";
    PermissionAction["EXPORT"] = "EXPORT";
})(PermissionAction || (exports.PermissionAction = PermissionAction = {}));
var PermissionModule;
(function (PermissionModule) {
    PermissionModule["LEDGER_GROUP"] = "LEDGER_GROUP";
    PermissionModule["LEDGER"] = "LEDGER";
    PermissionModule["UNIT"] = "UNIT";
    PermissionModule["ITEM_GROUP"] = "ITEM_GROUP";
    PermissionModule["ITEM_CATEGORY"] = "ITEM_CATEGORY";
    PermissionModule["ITEM"] = "ITEM";
    PermissionModule["VARIANT"] = "VARIANT";
    PermissionModule["GODOWN"] = "GODOWN";
    PermissionModule["RACK_BIN"] = "RACK_BIN";
    PermissionModule["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    PermissionModule["GOODS_RECEIPT_NOTE"] = "GOODS_RECEIPT_NOTE";
    PermissionModule["PURCHASE_INVOICE"] = "PURCHASE_INVOICE";
    PermissionModule["PURCHASE_RETURN"] = "PURCHASE_RETURN";
    PermissionModule["VENDOR_PAYMENT"] = "VENDOR_PAYMENT";
    PermissionModule["SALES_ORDER"] = "SALES_ORDER";
    PermissionModule["DELIVERY_CHALLAN"] = "DELIVERY_CHALLAN";
    PermissionModule["SALES_INVOICE"] = "SALES_INVOICE";
    PermissionModule["SALES_RETURN"] = "SALES_RETURN";
    PermissionModule["CUSTOMER_RECEIPT"] = "CUSTOMER_RECEIPT";
    PermissionModule["SETTINGS"] = "SETTINGS";
    PermissionModule["ROLES"] = "ROLES";
    PermissionModule["USERS"] = "USERS";
    PermissionModule["AUDIT_LOG"] = "AUDIT_LOG";
    PermissionModule["REPORTS"] = "REPORTS";
})(PermissionModule || (exports.PermissionModule = PermissionModule = {}));
var GstActiveLevel;
(function (GstActiveLevel) {
    GstActiveLevel["COMPANY"] = "COMPANY";
    GstActiveLevel["ITEM_GROUP"] = "ITEM_GROUP";
    GstActiveLevel["ITEM_CATEGORY"] = "ITEM_CATEGORY";
    GstActiveLevel["ITEM"] = "ITEM";
})(GstActiveLevel || (exports.GstActiveLevel = GstActiveLevel = {}));
var LedgerGroupNature;
(function (LedgerGroupNature) {
    LedgerGroupNature["ASSET"] = "ASSET";
    LedgerGroupNature["LIABILITY"] = "LIABILITY";
    LedgerGroupNature["INCOME"] = "INCOME";
    LedgerGroupNature["EXPENSE"] = "EXPENSE";
})(LedgerGroupNature || (exports.LedgerGroupNature = LedgerGroupNature = {}));
var BalanceType;
(function (BalanceType) {
    BalanceType["DR"] = "DR";
    BalanceType["CR"] = "CR";
})(BalanceType || (exports.BalanceType = BalanceType = {}));
var PurchaseType;
(function (PurchaseType) {
    PurchaseType["GOODS"] = "GOODS";
    PurchaseType["SERVICES"] = "SERVICES";
})(PurchaseType || (exports.PurchaseType = PurchaseType = {}));
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["PENDING"] = "PENDING";
    PurchaseOrderStatus["PARTIALLY_CLEARED"] = "PARTIALLY_CLEARED";
    PurchaseOrderStatus["CLEARED"] = "CLEARED";
    PurchaseOrderStatus["CANCELLED"] = "CANCELLED";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
var GrnStatus;
(function (GrnStatus) {
    GrnStatus["PENDING"] = "PENDING";
    GrnStatus["PARTIALLY_CLEARED"] = "PARTIALLY_CLEARED";
    GrnStatus["CLEARED"] = "CLEARED";
})(GrnStatus || (exports.GrnStatus = GrnStatus = {}));
var PurchaseInvoiceStatus;
(function (PurchaseInvoiceStatus) {
    PurchaseInvoiceStatus["PENDING"] = "PENDING";
    PurchaseInvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PurchaseInvoiceStatus["PAID"] = "PAID";
})(PurchaseInvoiceStatus || (exports.PurchaseInvoiceStatus = PurchaseInvoiceStatus = {}));
var SalesOrderStatus;
(function (SalesOrderStatus) {
    SalesOrderStatus["PENDING"] = "PENDING";
    SalesOrderStatus["PARTIALLY_DISPATCHED"] = "PARTIALLY_DISPATCHED";
    SalesOrderStatus["CLEARED"] = "CLEARED";
    SalesOrderStatus["CANCELLED"] = "CANCELLED";
})(SalesOrderStatus || (exports.SalesOrderStatus = SalesOrderStatus = {}));
var DeliveryChallanStatus;
(function (DeliveryChallanStatus) {
    DeliveryChallanStatus["PENDING"] = "PENDING";
    DeliveryChallanStatus["PARTIALLY_INVOICED"] = "PARTIALLY_INVOICED";
    DeliveryChallanStatus["CLEARED"] = "CLEARED";
})(DeliveryChallanStatus || (exports.DeliveryChallanStatus = DeliveryChallanStatus = {}));
var SalesInvoiceStatus;
(function (SalesInvoiceStatus) {
    SalesInvoiceStatus["PENDING"] = "PENDING";
    SalesInvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    SalesInvoiceStatus["PAID"] = "PAID";
})(SalesInvoiceStatus || (exports.SalesInvoiceStatus = SalesInvoiceStatus = {}));
var VoucherType;
(function (VoucherType) {
    VoucherType["PURCHASE_ORDER"] = "PO";
    VoucherType["GOODS_RECEIPT_NOTE"] = "GRN";
    VoucherType["PURCHASE_INVOICE"] = "PURCHASE_INVOICE";
    VoucherType["PURCHASE_RETURN"] = "PURCHASE_RETURN";
    VoucherType["VENDOR_PAYMENT"] = "VENDOR_PAYMENT";
    VoucherType["SALES_ORDER"] = "SO";
    VoucherType["DELIVERY_CHALLAN"] = "DC";
    VoucherType["SALES_INVOICE"] = "SALES_INVOICE";
    VoucherType["SALES_RETURN"] = "SALES_RETURN";
    VoucherType["CUSTOMER_RECEIPT"] = "CUSTOMER_RECEIPT";
    VoucherType["JOURNAL"] = "JOURNAL";
    VoucherType["PAYMENT"] = "PAYMENT";
    VoucherType["RECEIPT"] = "RECEIPT";
    VoucherType["CONTRA"] = "CONTRA";
    VoucherType["DEBIT_NOTE"] = "DEBIT_NOTE";
    VoucherType["CREDIT_NOTE"] = "CREDIT_NOTE";
})(VoucherType || (exports.VoucherType = VoucherType = {}));
var FeatureKey;
(function (FeatureKey) {
    FeatureKey["GST"] = "GST";
    FeatureKey["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    FeatureKey["GRN"] = "GRN";
    FeatureKey["SALES_ORDER"] = "SALES_ORDER";
    FeatureKey["DELIVERY_CHALLAN"] = "DELIVERY_CHALLAN";
    FeatureKey["VARIANTS"] = "VARIANTS";
    FeatureKey["RACK_BIN"] = "RACK_BIN";
    FeatureKey["MANUFACTURING"] = "MANUFACTURING";
})(FeatureKey || (exports.FeatureKey = FeatureKey = {}));
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["SIGNUP"] = "SIGNUP";
    OtpPurpose["FORGOT_PASSWORD"] = "FORGOT_PASSWORD";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
//# sourceMappingURL=index.js.map