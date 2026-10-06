import { FeatureKey } from '../../../common/enums';
export declare class FeatureToggle {
    id: string;
    tenantId: string;
    companyId: string;
    featureKey: FeatureKey;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
