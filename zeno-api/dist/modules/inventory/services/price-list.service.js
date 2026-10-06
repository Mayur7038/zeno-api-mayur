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
exports.PriceListService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const price_list_entity_1 = require("../entities/price-list.entity");
const price_list_item_entity_1 = require("../entities/price-list-item.entity");
const item_entity_1 = require("../../masters/entities/item.entity");
let PriceListService = class PriceListService {
    priceListRepo;
    itemRepo;
    masterItemRepo;
    dataSource;
    constructor(priceListRepo, itemRepo, masterItemRepo, dataSource) {
        this.priceListRepo = priceListRepo;
        this.itemRepo = itemRepo;
        this.masterItemRepo = masterItemRepo;
        this.dataSource = dataSource;
    }
    async getPriceLists(tenantId, companyId, query) {
        const qb = this.priceListRepo
            .createQueryBuilder('pl')
            .leftJoinAndSelect('pl.itemGroup', 'ig')
            .leftJoinAndSelect('pl.customer', 'cust')
            .leftJoinAndSelect('pl.item', 'singleItem')
            .leftJoinAndSelect('pl.items', 'lines')
            .leftJoinAndSelect('lines.item', 'lineItem')
            .leftJoinAndSelect('lineItem.unit', 'lineUnit')
            .where('pl.tenant_id = :tenantId', { tenantId })
            .andWhere('pl.company_id = :companyId', { companyId });
        if (query?.pricingType) {
            qb.andWhere('pl.pricing_type = :pricingType', { pricingType: query.pricingType });
        }
        if (query?.activeOnly) {
            qb.andWhere('pl.is_active = true');
        }
        qb.orderBy('pl.effective_from', 'DESC');
        return qb.getMany();
    }
    async getPriceListById(tenantId, id) {
        const pl = await this.priceListRepo.findOne({
            where: { id, tenantId },
            relations: [
                'itemGroup',
                'customer',
                'item',
                'items',
                'items.item',
                'items.item.unit',
                'items.variant',
            ],
        });
        if (!pl)
            throw new common_1.NotFoundException('Price list not found');
        return pl;
    }
    async createPriceList(tenantId, companyId, data) {
        if (!data.name)
            throw new common_1.BadRequestException('Price list name is required');
        if (!data.pricingType)
            throw new common_1.BadRequestException('Pricing dimension type is required');
        if (!data.effectiveFrom)
            throw new common_1.BadRequestException('Effective from date is required');
        if (data.pricingType === price_list_entity_1.PricingDimension.STOCK_GROUP_WISE && !data.itemGroupId) {
            throw new common_1.BadRequestException('Stock Group is required for Stock Group Wise price list');
        }
        if (data.pricingType === price_list_entity_1.PricingDimension.CUSTOMER_WISE && !data.customerId) {
            throw new common_1.BadRequestException('Customer is required for Customer Wise price list');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const priceList = queryRunner.manager.create(price_list_entity_1.PriceList, {
                tenantId,
                companyId,
                name: data.name,
                code: data.code || null,
                pricingType: data.pricingType,
                effectiveFrom: data.effectiveFrom,
                effectiveTo: data.effectiveTo || null,
                itemGroupId: data.itemGroupId || null,
                customerId: data.customerId || null,
                itemId: data.itemId || null,
                discountPercentage: Number(data.discountPercentage || 0),
                marginPercentage: Number(data.marginPercentage || 0),
                currency: data.currency || 'INR',
                isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
                notes: data.notes || null,
            });
            const savedPl = await queryRunner.manager.save(price_list_entity_1.PriceList, priceList);
            const itemsData = data.items || [];
            const linesToSave = [];
            for (const line of itemsData) {
                if (!line.itemId)
                    continue;
                const lineItem = queryRunner.manager.create(price_list_item_entity_1.PriceListItem, {
                    tenantId,
                    priceListId: savedPl.id,
                    itemId: line.itemId,
                    variantId: line.variantId || null,
                    standardRate: Number(line.standardRate || 0),
                    customRate: Number(line.customRate || line.standardRate || 0),
                    discountPercentage: Number(line.discountPercentage || 0),
                    minSellingPrice: Number(line.minSellingPrice || 0),
                    notes: line.notes || null,
                });
                linesToSave.push(lineItem);
            }
            if (linesToSave.length > 0) {
                await queryRunner.manager.save(price_list_item_entity_1.PriceListItem, linesToSave);
            }
            await queryRunner.commitTransaction();
            return this.getPriceListById(tenantId, savedPl.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updatePriceList(tenantId, id, data) {
        const existing = await this.priceListRepo.findOne({ where: { id, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('Price list not found');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            existing.name = data.name || existing.name;
            existing.code = data.code !== undefined ? data.code : existing.code;
            existing.pricingType = data.pricingType || existing.pricingType;
            existing.effectiveFrom = data.effectiveFrom || existing.effectiveFrom;
            existing.effectiveTo = data.effectiveTo !== undefined ? data.effectiveTo : existing.effectiveTo;
            existing.itemGroupId = data.itemGroupId !== undefined ? data.itemGroupId : existing.itemGroupId;
            existing.customerId = data.customerId !== undefined ? data.customerId : existing.customerId;
            existing.itemId = data.itemId !== undefined ? data.itemId : existing.itemId;
            existing.discountPercentage =
                data.discountPercentage !== undefined
                    ? Number(data.discountPercentage)
                    : existing.discountPercentage;
            existing.marginPercentage =
                data.marginPercentage !== undefined
                    ? Number(data.marginPercentage)
                    : existing.marginPercentage;
            existing.currency = data.currency || existing.currency;
            existing.isActive = data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive;
            existing.notes = data.notes !== undefined ? data.notes : existing.notes;
            await queryRunner.manager.save(price_list_entity_1.PriceList, existing);
            if (data.items !== undefined) {
                await queryRunner.manager.delete(price_list_item_entity_1.PriceListItem, { priceListId: existing.id, tenantId });
                const linesToSave = [];
                for (const line of data.items) {
                    if (!line.itemId)
                        continue;
                    const lineItem = queryRunner.manager.create(price_list_item_entity_1.PriceListItem, {
                        tenantId,
                        priceListId: existing.id,
                        itemId: line.itemId,
                        variantId: line.variantId || null,
                        standardRate: Number(line.standardRate || 0),
                        customRate: Number(line.customRate || line.standardRate || 0),
                        discountPercentage: Number(line.discountPercentage || 0),
                        minSellingPrice: Number(line.minSellingPrice || 0),
                        notes: line.notes || null,
                    });
                    linesToSave.push(lineItem);
                }
                if (linesToSave.length > 0) {
                    await queryRunner.manager.save(price_list_item_entity_1.PriceListItem, linesToSave);
                }
            }
            await queryRunner.commitTransaction();
            return this.getPriceListById(tenantId, existing.id);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async deletePriceList(tenantId, id) {
        const existing = await this.priceListRepo.findOne({ where: { id, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('Price list not found');
        await this.priceListRepo.delete({ id, tenantId });
        return { success: true, message: 'Price list deleted successfully' };
    }
    async getEffectivePrice(tenantId, companyId, itemId, customerId, asOfDate) {
        const item = await this.masterItemRepo.findOne({
            where: { id: itemId, tenantId },
            relations: ['itemGroup'],
        });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        const targetDate = asOfDate || new Date().toISOString().split('T')[0];
        const baseSaleRate = Number(item.saleRate || 0);
        if (customerId) {
            const customerPl = await this.priceListRepo
                .createQueryBuilder('pl')
                .leftJoinAndSelect('pl.items', 'pli', 'pli.item_id = :itemId', { itemId })
                .where('pl.tenant_id = :tenantId', { tenantId })
                .andWhere('pl.company_id = :companyId', { companyId })
                .andWhere('pl.customer_id = :customerId', { customerId })
                .andWhere('pl.pricing_type = :type', { type: price_list_entity_1.PricingDimension.CUSTOMER_WISE })
                .andWhere('pl.is_active = true')
                .andWhere('pl.effective_from <= :targetDate', { targetDate })
                .andWhere('(pl.effective_to IS NULL OR pl.effective_to >= :targetDate)', { targetDate })
                .orderBy('pl.effective_from', 'DESC')
                .getOne();
            if (customerPl) {
                const itemLine = customerPl.items?.find((i) => i.itemId === itemId);
                if (itemLine && Number(itemLine.customRate) > 0) {
                    return {
                        finalPrice: Number(itemLine.customRate),
                        standardRate: baseSaleRate,
                        discountPercentage: Number(itemLine.discountPercentage || customerPl.discountPercentage || 0),
                        ruleApplied: price_list_entity_1.PricingDimension.CUSTOMER_WISE,
                        priceListName: customerPl.name,
                    };
                }
                else if (Number(customerPl.discountPercentage) > 0) {
                    const discount = Number(customerPl.discountPercentage);
                    const finalPrice = Number((baseSaleRate * (1 - discount / 100)).toFixed(2));
                    return {
                        finalPrice,
                        standardRate: baseSaleRate,
                        discountPercentage: discount,
                        ruleApplied: price_list_entity_1.PricingDimension.CUSTOMER_WISE,
                        priceListName: customerPl.name,
                    };
                }
            }
        }
        if (item.itemGroupId) {
            const groupPl = await this.priceListRepo
                .createQueryBuilder('pl')
                .leftJoinAndSelect('pl.items', 'pli', 'pli.item_id = :itemId', { itemId })
                .where('pl.tenant_id = :tenantId', { tenantId })
                .andWhere('pl.company_id = :companyId', { companyId })
                .andWhere('pl.item_group_id = :groupId', { groupId: item.itemGroupId })
                .andWhere('pl.pricing_type = :type', { type: price_list_entity_1.PricingDimension.STOCK_GROUP_WISE })
                .andWhere('pl.is_active = true')
                .andWhere('pl.effective_from <= :targetDate', { targetDate })
                .andWhere('(pl.effective_to IS NULL OR pl.effective_to >= :targetDate)', { targetDate })
                .orderBy('pl.effective_from', 'DESC')
                .getOne();
            if (groupPl) {
                const itemLine = groupPl.items?.find((i) => i.itemId === itemId);
                if (itemLine && Number(itemLine.customRate) > 0) {
                    return {
                        finalPrice: Number(itemLine.customRate),
                        standardRate: baseSaleRate,
                        discountPercentage: Number(itemLine.discountPercentage || groupPl.discountPercentage || 0),
                        ruleApplied: price_list_entity_1.PricingDimension.STOCK_GROUP_WISE,
                        priceListName: groupPl.name,
                    };
                }
                else if (Number(groupPl.discountPercentage) > 0) {
                    const discount = Number(groupPl.discountPercentage);
                    const finalPrice = Number((baseSaleRate * (1 - discount / 100)).toFixed(2));
                    return {
                        finalPrice,
                        standardRate: baseSaleRate,
                        discountPercentage: discount,
                        ruleApplied: price_list_entity_1.PricingDimension.STOCK_GROUP_WISE,
                        priceListName: groupPl.name,
                    };
                }
            }
        }
        const productPl = await this.priceListRepo
            .createQueryBuilder('pl')
            .leftJoinAndSelect('pl.items', 'pli', 'pli.item_id = :itemId', { itemId })
            .where('pl.tenant_id = :tenantId', { tenantId })
            .andWhere('pl.company_id = :companyId', { companyId })
            .andWhere('pl.pricing_type = :type', { type: price_list_entity_1.PricingDimension.PRODUCT_WISE })
            .andWhere('pl.is_active = true')
            .andWhere('pl.effective_from <= :targetDate', { targetDate })
            .andWhere('(pl.effective_to IS NULL OR pl.effective_to >= :targetDate)', { targetDate })
            .andWhere('(pl.item_id = :itemId OR pli.id IS NOT NULL)', { itemId })
            .orderBy('pl.effective_from', 'DESC')
            .getOne();
        if (productPl) {
            const itemLine = productPl.items?.find((i) => i.itemId === itemId);
            if (itemLine && Number(itemLine.customRate) > 0) {
                return {
                    finalPrice: Number(itemLine.customRate),
                    standardRate: baseSaleRate,
                    discountPercentage: Number(itemLine.discountPercentage || productPl.discountPercentage || 0),
                    ruleApplied: price_list_entity_1.PricingDimension.PRODUCT_WISE,
                    priceListName: productPl.name,
                };
            }
        }
        return {
            finalPrice: baseSaleRate,
            standardRate: baseSaleRate,
            discountPercentage: 0,
            ruleApplied: 'STANDARD_RATE',
            priceListName: 'Standard Selling Price',
        };
    }
};
exports.PriceListService = PriceListService;
exports.PriceListService = PriceListService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(price_list_entity_1.PriceList)),
    __param(1, (0, typeorm_1.InjectRepository)(price_list_item_entity_1.PriceListItem)),
    __param(2, (0, typeorm_1.InjectRepository)(item_entity_1.Item)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], PriceListService);
//# sourceMappingURL=price-list.service.js.map