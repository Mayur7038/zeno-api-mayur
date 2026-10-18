import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerGroup } from '../entities/ledger-group.entity';
import { Ledger } from '../entities/ledger.entity';
import { Unit } from '../entities/unit.entity';
import { ItemGroup } from '../entities/item-group.entity';
import { ItemCategory } from '../entities/item-category.entity';
import { Item } from '../entities/item.entity';
import { ItemVariant } from '../entities/item-variant.entity';
import { VariantDefinition } from '../entities/variant-definition.entity';

import { LedgerGroupNature } from '../../../common/enums';

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(LedgerGroup)
    private groupRepo: Repository<LedgerGroup>,
    @InjectRepository(Ledger)
    private ledgerRepo: Repository<Ledger>,
    @InjectRepository(Unit)
    private unitRepo: Repository<Unit>,
    @InjectRepository(ItemGroup)
    private itemGroupRepo: Repository<ItemGroup>,
    @InjectRepository(ItemCategory)
    private itemCatRepo: Repository<ItemCategory>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    @InjectRepository(ItemVariant)
    private variantRepo: Repository<ItemVariant>,
    @InjectRepository(VariantDefinition)
    private variantDefRepo: Repository<VariantDefinition>,
  ) {}

  // 1. Ledger Groups
  async getLedgerGroups(tenantId: string, companyId?: string) {
    const qb = this.groupRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.parent', 'parent')
      .leftJoinAndSelect('group.children', 'children');

    if (tenantId) {
      qb.where('(group.tenant_id = :tenantId OR group.tenant_id IS NULL)', { tenantId });
    }

    if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId.trim() !== '') {
      qb.andWhere('(group.company_id = :companyId OR group.company_id IS NULL)', { companyId });
    }

    let groups = await qb.orderBy('group.name', 'ASC').getMany();
    console.log(groups , "asdfjadf" )

    // Deduplicate groups by normalized name in case multiple seedings occurred
    const deduplicatedMap = new Map<string, LedgerGroup>();
    for (const g of groups) {
      const key = (g.name || '').trim().toLowerCase();
      if (!deduplicatedMap.has(key)) {
        deduplicatedMap.set(key, g);
      }
    }

    console.log(groups , "asdfjadf" )

    groups = Array.from(deduplicatedMap.values());

    // If no groups exist, auto-seed standard Tally ledger groups for this tenant
    if (groups.length === 0 && tenantId) {
      const defaultGroupDefs = [
        { name: 'Capital Account', nature: LedgerGroupNature.LIABILITY, isPredefined: true },
        { name: 'Current Liabilities', nature: LedgerGroupNature.LIABILITY, isPredefined: true },
        {
          name: 'Sundry Creditors (Vendors)',
          nature: LedgerGroupNature.LIABILITY,
          isCreditorVendor: true,
          isPredefined: true,
        },
        { name: 'Duties & Taxes', nature: LedgerGroupNature.LIABILITY, isPredefined: true },
        { name: 'Current Assets', nature: LedgerGroupNature.ASSET, isPredefined: true },
        {
          name: 'Sundry Debtors (Customers)',
          nature: LedgerGroupNature.ASSET,
          isDebtorCustomer: true,
          isPredefined: true,
        },
        { name: 'Bank Accounts', nature: LedgerGroupNature.ASSET, isPredefined: true },
        { name: 'Cash-in-hand', nature: LedgerGroupNature.ASSET, isPredefined: true },
        { name: 'Stock-in-hand', nature: LedgerGroupNature.ASSET, isPredefined: true },
        { name: 'Purchase Accounts', nature: LedgerGroupNature.EXPENSE, isPredefined: true },
        { name: 'Direct Expenses', nature: LedgerGroupNature.EXPENSE, isPredefined: true },
        { name: 'Indirect Expenses', nature: LedgerGroupNature.EXPENSE, isPredefined: true },
        { name: 'Sales Accounts', nature: LedgerGroupNature.INCOME, isPredefined: true },
        { name: 'Direct Incomes', nature: LedgerGroupNature.INCOME, isPredefined: true },
        { name: 'Indirect Incomes', nature: LedgerGroupNature.INCOME, isPredefined: true },
      ];

      for (const def of defaultGroupDefs) {
        try {
          const existing = await this.groupRepo.findOne({
            where: { tenantId, name: def.name },
          });
          if (!existing) {
            const g = this.groupRepo.create({
              tenantId,
              companyId: companyId && companyId !== 'undefined' && companyId !== 'null' ? companyId : undefined,
              name: def.name,
              nature: def.nature,
              isCreditorVendor: def.isCreditorVendor || false,
              isDebtorCustomer: def.isDebtorCustomer || false,
              isPredefined: true,
            });
            await this.groupRepo.save(g);
          }
        } catch {
          // Ignore individual constraint errors during auto-seed
        }
      }

      const freshGroups = await qb.orderBy('group.name', 'ASC').getMany();
      const freshMap = new Map<string, LedgerGroup>();
      for (const g of freshGroups) {
        const key = (g.name || '').trim().toLowerCase();
        if (!freshMap.has(key)) {
          freshMap.set(key, g);
        }
      }
      groups = Array.from(freshMap.values());
    }
    console.log(groups , "asdfjadf" )
    return groups;
  }

  async createLedgerGroup(tenantId: string, companyId: string, data: Partial<LedgerGroup>) {
    const group = this.groupRepo.create({
      ...data,
      tenantId,
      companyId,
      isPredefined: false,
    });
    return this.groupRepo.save(group);
  }

  async updateLedgerGroup(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      parentId?: string;
      nature?: any;
      isCreditorVendor?: boolean;
      isDebtorCustomer?: boolean;
    },
  ) {
    const group = await this.groupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new BadRequestException('Ledger group not found');

    if (data.name) group.name = data.name;
    if (data.code !== undefined) group.code = data.code;
    if (data.parentId !== undefined) group.parentId = data.parentId;
    if (data.nature !== undefined) group.nature = data.nature;
    if (data.isCreditorVendor !== undefined) group.isCreditorVendor = data.isCreditorVendor;
    if (data.isDebtorCustomer !== undefined) group.isDebtorCustomer = data.isDebtorCustomer;

    return this.groupRepo.save(group);
  }

  async deleteLedgerGroup(tenantId: string, id: string) {
    const group = await this.groupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new BadRequestException('Ledger group not found');
    if (group.isPredefined) {
      throw new BadRequestException('Predefined ledger groups can be renamed but NOT deleted');
    }
    await this.groupRepo.delete({ id, tenantId });
    return { success: true, message: 'Ledger group deleted' };
  }

  // 2. Ledgers
  async getLedgers(tenantId: string, companyId: string, isVendorOnly = false, isCustomerOnly = false) {
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

  async createLedger(tenantId: string, companyId: string, data: Partial<Ledger>) {
    const ledger = this.ledgerRepo.create({
      ...data,
      tenantId,
      companyId,
      isPredefined: false,
    });
    return this.ledgerRepo.save(ledger);
  }

  async updateLedger(tenantId: string, id: string, data: Partial<Ledger>) {
    const ledger = await this.ledgerRepo.findOne({ where: { id, tenantId } });
    if (!ledger) throw new BadRequestException('Ledger not found');
    Object.assign(ledger, data);
    return this.ledgerRepo.save(ledger);
  }

  async deleteLedger(tenantId: string, id: string) {
    const ledger = await this.ledgerRepo.findOne({ where: { id, tenantId } });
    if (!ledger) throw new BadRequestException('Ledger not found');
    if (ledger.isPredefined) {
      throw new BadRequestException('Predefined standard ledgers cannot be deleted');
    }
    await this.ledgerRepo.delete({ id, tenantId });
    return { success: true, message: 'Ledger deleted' };
  }

  // 3. Units
  async getUnits(tenantId: string, companyId: string) {
    return this.unitRepo.find({
      where: { tenantId, companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createUnit(tenantId: string, companyId: string, data: Partial<Unit>) {
    const unit = this.unitRepo.create({ ...data, tenantId, companyId });
    return this.unitRepo.save(unit);
  }

  async updateUnit(tenantId: string, id: string, data: Partial<Unit>) {
    const unit = await this.unitRepo.findOne({ where: { id, tenantId } });
    if (!unit) throw new BadRequestException('Unit not found');
    Object.assign(unit, data);
    return this.unitRepo.save(unit);
  }

  async deleteUnit(tenantId: string, id: string) {
    const unit = await this.unitRepo.findOne({ where: { id, tenantId } });
    if (!unit) throw new BadRequestException('Unit not found');
    await this.unitRepo.delete({ id, tenantId });
    return { success: true, message: 'Unit deleted' };
  }

  // 4. Item Groups (Stock Groups) & Categories
  async getItemGroups(tenantId: string, companyId: string) {
    return this.itemGroupRepo.find({
      where: { tenantId, companyId },
      relations: ['categories'],
      order: { name: 'ASC' },
    });
  }

  async createItemGroup(tenantId: string, companyId: string, data: Partial<ItemGroup>) {
    const group = this.itemGroupRepo.create({ ...data, tenantId, companyId });
    return this.itemGroupRepo.save(group);
  }

  async updateItemGroup(tenantId: string, id: string, data: Partial<ItemGroup>) {
    const group = await this.itemGroupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new BadRequestException('Item group not found');
    Object.assign(group, data);
    return this.itemGroupRepo.save(group);
  }

  async deleteItemGroup(tenantId: string, id: string) {
    const group = await this.itemGroupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new BadRequestException('Item group not found');
    await this.itemGroupRepo.delete({ id, tenantId });
    return { success: true, message: 'Item group deleted' };
  }

  async getItemCategories(tenantId: string, companyId: string, itemGroupId?: string) {
    const where: any = { tenantId, companyId };
    if (itemGroupId) where.itemGroupId = itemGroupId;
    return this.itemCatRepo.find({ where, relations: ['itemGroup'], order: { name: 'ASC' } });
  }

  async createItemCategory(tenantId: string, companyId: string, data: Partial<ItemCategory>) {
    const cat = this.itemCatRepo.create({ ...data, tenantId, companyId });
    return this.itemCatRepo.save(cat);
  }

  async updateItemCategory(tenantId: string, id: string, data: Partial<ItemCategory>) {
    const cat = await this.itemCatRepo.findOne({ where: { id, tenantId } });
    if (!cat) throw new BadRequestException('Item category not found');
    Object.assign(cat, data);
    return this.itemCatRepo.save(cat);
  }

  async deleteItemCategory(tenantId: string, id: string) {
    const cat = await this.itemCatRepo.findOne({ where: { id, tenantId } });
    if (!cat) throw new BadRequestException('Item category not found');
    await this.itemCatRepo.delete({ id, tenantId });
    return { success: true, message: 'Item category deleted' };
  }

  // 5. Item Variants
  async getVariants(tenantId: string, companyId?: string, itemId?: string) {
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

  async createVariant(tenantId: string, data: Partial<ItemVariant>) {
    const variant = this.variantRepo.create({ ...data, tenantId });
    return this.variantRepo.save(variant);
  }

  async updateVariant(tenantId: string, id: string, data: Partial<ItemVariant>) {
    const variant = await this.variantRepo.findOne({ where: { id, tenantId } });
    if (!variant) throw new BadRequestException('Variant not found');
    Object.assign(variant, data);
    return this.variantRepo.save(variant);
  }

  async deleteVariant(tenantId: string, id: string) {
    const variant = await this.variantRepo.findOne({ where: { id, tenantId } });
    if (!variant) throw new BadRequestException('Variant not found');
    await this.variantRepo.delete({ id, tenantId });
    return { success: true, message: 'Variant deleted' };
  }

  // 6. Variant Master Definitions
  async getVariantDefinitions(tenantId: string, companyId?: string) {
    const qb = this.variantDefRepo
      .createQueryBuilder('vd')
      .where('vd.tenant_id = :tenantId', { tenantId });

    if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId.trim() !== '') {
      qb.andWhere('(vd.company_id = :companyId OR vd.company_id IS NULL)', { companyId });
    }

    return qb.orderBy('vd.name', 'ASC').getMany();
  }

  async getVariantDefinitionById(tenantId: string, id: string) {
    return this.variantDefRepo.findOne({ where: { id, tenantId } });
  }

  async createVariantDefinition(tenantId: string, companyId: string, data: Partial<VariantDefinition>) {
    const vd = this.variantDefRepo.create({ ...data, tenantId, companyId });
    return this.variantDefRepo.save(vd);
  }

  async updateVariantDefinition(tenantId: string, id: string, data: Partial<VariantDefinition>) {
    const vd = await this.variantDefRepo.findOne({ where: { id, tenantId } });
    if (!vd) throw new BadRequestException('Variant definition not found');
    Object.assign(vd, data);
    return this.variantDefRepo.save(vd);
  }

  async deleteVariantDefinition(tenantId: string, id: string) {
    const vd = await this.variantDefRepo.findOne({ where: { id, tenantId } });
    if (!vd) throw new BadRequestException('Variant definition not found');
    await this.variantDefRepo.delete({ id, tenantId });
    return { success: true, message: 'Variant definition deleted' };
  }

  // 7. Items & Variants
  async getItems(tenantId: string, companyId: string, search?: string) {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.unit', 'unit')
      .leftJoinAndSelect('item.itemGroup', 'itemGroup')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.variants', 'variants')
      .where('item.tenant_id = :tenantId', { tenantId })
      .andWhere('item.company_id = :companyId', { companyId });

    if (search) {
      qb.andWhere(
        '(LOWER(item.name) LIKE :s OR LOWER(item.sku) LIKE :s OR LOWER(item.hsn_sac) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }

    return qb.orderBy('item.name', 'ASC').getMany();
  }

  async getItemById(tenantId: string, id: string) {
    return this.itemRepo.findOne({
      where: { id, tenantId },
      relations: ['unit', 'itemGroup', 'category', 'variants'],
    });
  }

  async createItem(tenantId: string, companyId: string, data: Partial<Item> & { variants?: any[] }) {
    const { variants, ...itemData } = data;
    const item = this.itemRepo.create({ ...itemData, tenantId, companyId });
    const savedItem = await this.itemRepo.save(item);

    if (variants && variants.length > 0) {
      const vars = variants.map((v) =>
        this.variantRepo.create({
          ...v,
          tenantId,
          itemId: savedItem.id,
        }),
      );
      await this.variantRepo.save(vars);
    }

    return this.getItemById(tenantId, savedItem.id);
  }

  async updateItem(tenantId: string, id: string, data: Partial<Item> & { variants?: any[] }) {
    const { variants, ...itemData } = data;
    const item = await this.itemRepo.findOne({ where: { id, tenantId } });
    if (!item) throw new BadRequestException('Item not found');
    Object.assign(item, itemData);
    await this.itemRepo.save(item);

    if (variants && Array.isArray(variants)) {
      await this.variantRepo.delete({ itemId: id, tenantId });
      if (variants.length > 0) {
        const vars = variants.map((v) =>
          this.variantRepo.create({
            ...v,
            tenantId,
            itemId: id,
          }),
        );
        await this.variantRepo.save(vars);
      }
    }

    return this.getItemById(tenantId, id);
  }

  async deleteItem(tenantId: string, id: string) {
    const item = await this.itemRepo.findOne({ where: { id, tenantId } });
    if (!item) throw new BadRequestException('Item not found');
    await this.variantRepo.delete({ itemId: id, tenantId });
    await this.itemRepo.delete({ id, tenantId });
    return { success: true, message: 'Item deleted' };
  }
}
