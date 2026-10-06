import { Repository, DataSource } from 'typeorm';
import { PriceList, PricingDimension } from '../entities/price-list.entity';
import { PriceListItem } from '../entities/price-list-item.entity';
import { Item } from '../../masters/entities/item.entity';
export declare class PriceListService {
    private priceListRepo;
    private itemRepo;
    private masterItemRepo;
    private dataSource;
    constructor(priceListRepo: Repository<PriceList>, itemRepo: Repository<PriceListItem>, masterItemRepo: Repository<Item>, dataSource: DataSource);
    getPriceLists(tenantId: string, companyId: string, query?: {
        pricingType?: PricingDimension;
        activeOnly?: boolean;
    }): Promise<PriceList[]>;
    getPriceListById(tenantId: string, id: string): Promise<PriceList>;
    createPriceList(tenantId: string, companyId: string, data: any): Promise<PriceList>;
    updatePriceList(tenantId: string, id: string, data: any): Promise<PriceList>;
    deletePriceList(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getEffectivePrice(tenantId: string, companyId: string, itemId: string, customerId?: string, asOfDate?: string): Promise<{
        finalPrice: number;
        standardRate: number;
        discountPercentage: number;
        ruleApplied: string;
        priceListName: string;
    }>;
}
