import { SettingsService } from '../services/settings.service';
import { FeatureKey } from '../../../common/enums';
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
    getSettings(tenantId: string, companyId: string): Promise<import("../entities/company-settings.entity").CompanySettings>;
    updateSettings(tenantId: string, companyId: string, body: any): Promise<import("../entities/company-settings.entity").CompanySettings>;
    getToggles(tenantId: string, companyId: string): Promise<import("../entities/feature-toggle.entity").FeatureToggle[]>;
    setToggle(tenantId: string, body: {
        companyId: string;
        featureKey: FeatureKey;
        isEnabled: boolean;
    }): Promise<import("../entities/feature-toggle.entity").FeatureToggle>;
    getTaxMasters(tenantId: string, companyId: string): Promise<import("../entities/tax-master.entity").TaxMaster[]>;
    createTaxMaster(tenantId: string, body: any): Promise<import("../entities/tax-master.entity").TaxMaster>;
}
