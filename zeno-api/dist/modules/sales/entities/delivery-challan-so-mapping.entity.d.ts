import { DeliveryChallan } from './delivery-challan.entity';
import { SalesOrder } from './sales-order.entity';
export declare class DeliveryChallanSoMapping {
    id: string;
    deliveryChallanId: string;
    deliveryChallan: DeliveryChallan;
    salesOrderId: string;
    salesOrder: SalesOrder;
    createdAt: Date;
}
