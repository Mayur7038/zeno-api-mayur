import { Repository } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';
import { InventoryService } from '../services/inventory.service';
import { StockTransferService } from '../services/stock-transfer.service';
import { StockAdjustmentService } from '../services/stock-adjustment.service';
import { PriceListService } from '../services/price-list.service';
import { PricingDimension } from '../entities/price-list.entity';
export declare class InventoryController {
    private inventoryService;
    private transferService;
    private adjustmentService;
    private priceListService;
    private stockRepo;
    constructor(inventoryService: InventoryService, transferService: StockTransferService, adjustmentService: StockAdjustmentService, priceListService: PriceListService, stockRepo: Repository<StockLedger>);
    getStockSummary(tenantId: string, companyId: string, godownId?: string): Promise<{
        itemId: any;
        itemName: any;
        sku: any;
        unit: any;
        currentStock: number;
        averageRate: number;
        totalValue: number;
    }[]>;
    getItemBalance(tenantId: string, companyId: string, godownId: string, itemId: string, variantId?: string): Promise<{
        itemId: string;
        godownId: string;
        variantId: string;
        currentBalance: number;
    }>;
    getOpeningBalances(tenantId: string, companyId: string, godownId: string): Promise<{
        itemId: any;
        itemName: any;
        sku: any;
        itemGroupId: any;
        itemGroupName: any;
        unitCode: any;
        standardPurchaseRate: number;
        standardSaleRate: number;
        openingQty: number;
        unitRate: number;
        totalValue: number;
        effectiveDate: string;
        ledgerId: string;
    }[]>;
    updateOpeningBalances(tenantId: string, body: any): Promise<{
        itemId: any;
        itemName: any;
        sku: any;
        itemGroupId: any;
        itemGroupName: any;
        unitCode: any;
        standardPurchaseRate: number;
        standardSaleRate: number;
        openingQty: number;
        unitRate: number;
        totalValue: number;
        effectiveDate: string;
        ledgerId: string;
    }[]>;
    getTransfers(tenantId: string, companyId: string): Promise<import("../entities/stock-transfer.entity").StockTransfer[]>;
    getTransferById(tenantId: string, id: string): Promise<import("../entities/stock-transfer.entity").StockTransfer>;
    createTransfer(tenantId: string, body: any): Promise<import("../entities/stock-transfer.entity").StockTransfer>;
    cancelTransfer(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAdjustments(tenantId: string, companyId: string): Promise<import("../entities/stock-adjustment.entity").StockAdjustment[]>;
    getAdjustmentById(tenantId: string, id: string): Promise<import("../entities/stock-adjustment.entity").StockAdjustment>;
    createAdjustment(tenantId: string, body: any): Promise<import("../entities/stock-adjustment.entity").StockAdjustment>;
    cancelAdjustment(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPriceLists(tenantId: string, companyId: string, pricingType?: PricingDimension, activeOnly?: string): Promise<import("../entities/price-list.entity").PriceList[]>;
    getEffectivePrice(tenantId: string, companyId: string, itemId: string, customerId?: string, asOfDate?: string): Promise<{
        finalPrice: number;
        standardRate: number;
        discountPercentage: number;
        ruleApplied: string;
        priceListName: string;
    }>;
    getPriceListById(tenantId: string, id: string): Promise<import("../entities/price-list.entity").PriceList>;
    createPriceList(tenantId: string, body: any): Promise<import("../entities/price-list.entity").PriceList>;
    updatePriceList(tenantId: string, id: string, body: any): Promise<import("../entities/price-list.entity").PriceList>;
    deletePriceList(tenantId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
