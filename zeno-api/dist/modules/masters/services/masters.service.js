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
exports.MastersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ledger_group_entity_1 = require("../entities/ledger-group.entity");
const ledger_entity_1 = require("../entities/ledger.entity");
const unit_entity_1 = require("../entities/unit.entity");
const item_group_entity_1 = require("../entities/item-group.entity");
const item_category_entity_1 = require("../entities/item-category.entity");
const item_entity_1 = require("../entities/item.entity");
const item_variant_entity_1 = require("../entities/item-variant.entity");
let MastersService = class MastersService {
    groupRepo;
    ledgerRepo;
    unitRepo;
    itemGroupRepo;
    itemCatRepo;
    itemRepo;
    variantRepo;
    constructor(groupRepo, ledgerRepo, unitRepo, itemGroupRepo, itemCatRepo, itemRepo, variantRepo) {
        this.groupRepo = groupRepo;
        this.ledgerRepo = ledgerRepo;
        this.unitRepo = unitRepo;
        this.itemGroupRepo = itemGroupRepo;
        this.itemCatRepo = itemCatRepo;
        this.itemRepo = itemRepo;
        this.variantRepo = variantRepo;
    }
    async getLedgerGroups(tenantId, companyId) {
        const qb = this.groupRepo
            .createQueryBuilder('group')
            .leftJoinAndSelect('group.parent', 'parent')
            .leftJoinAndSelect('group.children', 'children')
            .where('group.tenant_id = :tenantId', { tenantId });
        if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId.trim() !== '') {
            qb.andWhere('(group.company_id = :companyId OR group.is_predefined = true)', { companyId });
        }
        return qb.orderBy('group.name', 'ASC').getMany();
    }
    async createLedgerGroup(tenantId, companyId, data) {
        const group = this.groupRepo.create({
            ...data,
            tenantId,
            companyId,
            isPredefined: false,
        });
        return this.groupRepo.save(group);
    }
    async updateLedgerGroup(tenantId, id, data) {
        const group = await this.groupRepo.findOne({ where: { id, tenantId } });
        if (!group)
            throw new common_1.BadRequestException('Ledger group not found');
        if (data.name)
            group.name = data.name;
        if (data.code !== undefined)
            group.code = data.code;
        if (data.parentId !== undefined)
            group.parentId = data.parentId;
        if (data.nature !== undefined)
            group.nature = data.nature;
        if (data.isCreditorVendor !== undefined)
            group.isCreditorVendor = data.isCreditorVendor;
        if (data.isDebtorCustomer !== undefined)
            group.isDebtorCustomer = data.isDebtorCustomer;
        return this.groupRepo.save(group);
    }
    async deleteLedgerGroup(tenantId, id) {
        const group = await this.groupRepo.findOne({ where: { id, tenantId } });
        if (!group)
            throw new common_1.BadRequestException('Ledger group not found');
        if (group.isPredefined) {
            throw new common_1.BadRequestException('Predefined ledger groups can be renamed but NOT deleted');
        }
        await this.groupRepo.delete({ id, tenantId });
        return { success: true, message: 'Ledger group deleted' };
    }
    async getLedgers(tenantId, companyId, isVendorOnly = false, isCustomerOnly = false) {
        const qb = this.ledgerRepo
            .createQueryBuilder('ledger')
            .leftJoinAndSelect('ledger.ledgerGroup', 'group')
            .where('ledger.tenant_id = :tenantId', { tenantId })
            .andWhere('ledger.company_id = :companyId', { companyId });
        if (isVendorOnly) {
            qb.andWhere('group.is_creditor_vendor = true');
        }
        if (isCustomerOnly) {
            qb.andWhere('group.is_debtor_customer = true');
        }
        return qb.orderBy('ledger.name', 'ASC').getMany();
    }
    async createLedger(tenantId, companyId, data) {
        const ledger = this.ledgerRepo.create({
            ...data,
            tenantId,
            companyId,
            isPredefined: false,
        });
        return this.ledgerRepo.save(ledger);
    }
    async updateLedger(tenantId, id, data) {
        const ledger = await this.ledgerRepo.findOne({ where: { id, tenantId } });
        if (!ledger)
            throw new common_1.BadRequestException('Ledger not found');
        Object.assign(ledger, data);
        return this.ledgerRepo.save(ledger);
    }
    async deleteLedger(tenantId, id) {
        const ledger = await this.ledgerRepo.findOne({ where: { id, tenantId } });
        if (!ledger)
            throw new common_1.BadRequestException('Ledger not found');
        if (ledger.isPredefined) {
            throw new common_1.BadRequestException('Predefined standard ledgers cannot be deleted');
        }
        await this.ledgerRepo.delete({ id, tenantId });
        return { success: true, message: 'Ledger deleted' };
    }
    async getUnits(tenantId, companyId) {
        return this.unitRepo.find({
            where: { tenantId, companyId, isActive: true },
            order: { name: 'ASC' },
        });
    }
    async createUnit(tenantId, companyId, data) {
        const unit = this.unitRepo.create({ ...data, tenantId, companyId });
        return this.unitRepo.save(unit);
    }
    async updateUnit(tenantId, id, data) {
        const unit = await this.unitRepo.findOne({ where: { id, tenantId } });
        if (!unit)
            throw new common_1.BadRequestException('Unit not found');
        Object.assign(unit, data);
        return this.unitRepo.save(unit);
    }
    async deleteUnit(tenantId, id) {
        const unit = await this.unitRepo.findOne({ where: { id, tenantId } });
        if (!unit)
            throw new common_1.BadRequestException('Unit not found');
        await this.unitRepo.delete({ id, tenantId });
        return { success: true, message: 'Unit deleted' };
    }
    async getItemGroups(tenantId, companyId) {
        return this.itemGroupRepo.find({
            where: { tenantId, companyId },
            relations: ['categories'],
            order: { name: 'ASC' },
        });
    }
    async createItemGroup(tenantId, companyId, data) {
        const group = this.itemGroupRepo.create({ ...data, tenantId, companyId });
        return this.itemGroupRepo.save(group);
    }
    async updateItemGroup(tenantId, id, data) {
        const group = await this.itemGroupRepo.findOne({ where: { id, tenantId } });
        if (!group)
            throw new common_1.BadRequestException('Item group not found');
        Object.assign(group, data);
        return this.itemGroupRepo.save(group);
    }
    async deleteItemGroup(tenantId, id) {
        const group = await this.itemGroupRepo.findOne({ where: { id, tenantId } });
        if (!group)
            throw new common_1.BadRequestException('Item group not found');
        await this.itemGroupRepo.delete({ id, tenantId });
        return { success: true, message: 'Item group deleted' };
    }
    async getItemCategories(tenantId, companyId, itemGroupId) {
        const where = { tenantId, companyId };
        if (itemGroupId)
            where.itemGroupId = itemGroupId;
        return this.itemCatRepo.find({ where, relations: ['itemGroup'], order: { name: 'ASC' } });
    }
    async createItemCategory(tenantId, companyId, data) {
        const cat = this.itemCatRepo.create({ ...data, tenantId, companyId });
        return this.itemCatRepo.save(cat);
    }
    async updateItemCategory(tenantId, id, data) {
        const cat = await this.itemCatRepo.findOne({ where: { id, tenantId } });
        if (!cat)
            throw new common_1.BadRequestException('Item category not found');
        Object.assign(cat, data);
        return this.itemCatRepo.save(cat);
    }
    async deleteItemCategory(tenantId, id) {
        const cat = await this.itemCatRepo.findOne({ where: { id, tenantId } });
        if (!cat)
            throw new common_1.BadRequestException('Item category not found');
        await this.itemCatRepo.delete({ id, tenantId });
        return { success: true, message: 'Item category deleted' };
    }
    async getVariants(tenantId, companyId, itemId) {
        const qb = this.variantRepo
            .createQueryBuilder('variant')
            .leftJoinAndSelect('variant.item', 'item')
            .where('variant.tenant_id = :tenantId', { tenantId });
        if (companyId) {
            qb.andWhere('item.company_id = :companyId', { companyId });
        }
        if (itemId) {
            qb.andWhere('variant.item_id = :itemId', { itemId });
        }
        return qb.orderBy('variant.name', 'ASC').getMany();
    }
    async createVariant(tenantId, data) {
        const variant = this.variantRepo.create({ ...data, tenantId });
        return this.variantRepo.save(variant);
    }
    async updateVariant(tenantId, id, data) {
        const variant = await this.variantRepo.findOne({ where: { id, tenantId } });
        if (!variant)
            throw new common_1.BadRequestException('Variant not found');
        Object.assign(variant, data);
        return this.variantRepo.save(variant);
    }
    async deleteVariant(tenantId, id) {
        const variant = await this.variantRepo.findOne({ where: { id, tenantId } });
        if (!variant)
            throw new common_1.BadRequestException('Variant not found');
        await this.variantRepo.delete({ id, tenantId });
        return { success: true, message: 'Variant deleted' };
    }
    async getItems(tenantId, companyId, search) {
        const qb = this.itemRepo
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.unit', 'unit')
            .leftJoinAndSelect('item.itemGroup', 'itemGroup')
            .leftJoinAndSelect('item.category', 'category')
            .leftJoinAndSelect('item.variants', 'variants')
            .where('item.tenant_id = :tenantId', { tenantId })
            .andWhere('item.company_id = :companyId', { companyId });
        if (search) {
            qb.andWhere('(LOWER(item.name) LIKE :s OR LOWER(item.sku) LIKE :s OR LOWER(item.hsn_sac) LIKE :s)', { s: `%${search.toLowerCase()}%` });
        }
        return qb.orderBy('item.name', 'ASC').getMany();
    }
    async getItemById(tenantId, id) {
        return this.itemRepo.findOne({
            where: { id, tenantId },
            relations: ['unit', 'itemGroup', 'category', 'variants'],
        });
    }
    async createItem(tenantId, companyId, data) {
        const { variants, ...itemData } = data;
        const item = this.itemRepo.create({ ...itemData, tenantId, companyId });
        const savedItem = await this.itemRepo.save(item);
        if (variants && variants.length > 0) {
            const vars = variants.map((v) => this.variantRepo.create({
                ...v,
                tenantId,
                itemId: savedItem.id,
            }));
            await this.variantRepo.save(vars);
        }
        return this.getItemById(tenantId, savedItem.id);
    }
    async updateItem(tenantId, id, data) {
        const item = await this.itemRepo.findOne({ where: { id, tenantId } });
        if (!item)
            throw new common_1.BadRequestException('Item not found');
        Object.assign(item, data);
        return this.itemRepo.save(item);
    }
};
exports.MastersService = MastersService;
exports.MastersService = MastersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ledger_group_entity_1.LedgerGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(ledger_entity_1.Ledger)),
    __param(2, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __param(3, (0, typeorm_1.InjectRepository)(item_group_entity_1.ItemGroup)),
    __param(4, (0, typeorm_1.InjectRepository)(item_category_entity_1.ItemCategory)),
    __param(5, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __param(6, (0, typeorm_1.InjectRepository)(item_variant_entity_1.ItemVariant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MastersService);
//# sourceMappingURL=masters.service.js.map