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
exports.VoucherSequenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const voucher_sequence_entity_1 = require("../entities/voucher-sequence.entity");
const enums_1 = require("../../../common/enums");
let VoucherSequenceService = class VoucherSequenceService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async getNextVoucherNumber(manager, tenantId, companyId, branchId, voucherType, financialYear = '2025-2026') {
        let seq = await manager
            .createQueryBuilder(voucher_sequence_entity_1.VoucherSequence, 'seq')
            .setLock('pessimistic_write')
            .where('seq.tenant_id = :tenantId', { tenantId })
            .andWhere('seq.company_id = :companyId', { companyId })
            .andWhere('seq.branch_id = :branchId', { branchId })
            .andWhere('seq.voucher_type = :voucherType', { voucherType })
            .andWhere('seq.financial_year = :financialYear', { financialYear })
            .getOne();
        if (!seq) {
            const defaultPrefix = this.getDefaultPrefix(voucherType);
            seq = manager.create(voucher_sequence_entity_1.VoucherSequence, {
                tenantId,
                companyId,
                branchId,
                voucherType,
                financialYear,
                prefix: `${defaultPrefix}/${financialYear.substring(2, 4)}-${financialYear.substring(7, 9)}/`,
                suffix: '',
                currentNumber: 0,
                paddingDigits: 4,
            });
            await manager.save(voucher_sequence_entity_1.VoucherSequence, seq);
            seq = await manager
                .createQueryBuilder(voucher_sequence_entity_1.VoucherSequence, 'seq')
                .setLock('pessimistic_write')
                .where('seq.id = :id', { id: seq.id })
                .getOne();
        }
        const nextNumber = Number(seq.currentNumber) + 1;
        seq.currentNumber = nextNumber;
        await manager.save(voucher_sequence_entity_1.VoucherSequence, seq);
        const paddedNumber = String(nextNumber).padStart(seq.paddingDigits, '0');
        return `${seq.prefix || ''}${paddedNumber}${seq.suffix || ''}`;
    }
    getDefaultPrefix(type) {
        switch (type) {
            case enums_1.VoucherType.PURCHASE_ORDER:
                return 'PO';
            case enums_1.VoucherType.GOODS_RECEIPT_NOTE:
                return 'GRN';
            case enums_1.VoucherType.PURCHASE_INVOICE:
                return 'PI';
            case enums_1.VoucherType.PURCHASE_RETURN:
                return 'PR';
            case enums_1.VoucherType.VENDOR_PAYMENT:
            case enums_1.VoucherType.PAYMENT:
                return 'PAY';
            case enums_1.VoucherType.SALES_ORDER:
                return 'SO';
            case enums_1.VoucherType.DELIVERY_CHALLAN:
                return 'DC';
            case enums_1.VoucherType.SALES_INVOICE:
                return 'SI';
            case enums_1.VoucherType.SALES_RETURN:
                return 'SR';
            case enums_1.VoucherType.CUSTOMER_RECEIPT:
            case enums_1.VoucherType.RECEIPT:
                return 'REC';
            case enums_1.VoucherType.CONTRA:
                return 'CNT';
            case enums_1.VoucherType.JOURNAL:
                return 'JRN';
            case enums_1.VoucherType.DEBIT_NOTE:
                return 'DRN';
            case enums_1.VoucherType.CREDIT_NOTE:
                return 'CRN';
            default:
                return 'VOUCH';
        }
    }
};
exports.VoucherSequenceService = VoucherSequenceService;
exports.VoucherSequenceService = VoucherSequenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], VoucherSequenceService);
//# sourceMappingURL=voucher-sequence.service.js.map