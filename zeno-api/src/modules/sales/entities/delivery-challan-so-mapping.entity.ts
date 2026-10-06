import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { DeliveryChallan } from './delivery-challan.entity';
import { SalesOrder } from './sales-order.entity';

@Entity('delivery_challan_so_mappings')
@Unique(['deliveryChallanId', 'salesOrderId'])
export class DeliveryChallanSoMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'delivery_challan_id', type: 'uuid' })
  deliveryChallanId: string;

  @ManyToOne(() => DeliveryChallan, (dc) => dc.salesOrders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_challan_id' })
  deliveryChallan: DeliveryChallan;

  @Index()
  @Column({ name: 'sales_order_id', type: 'uuid' })
  salesOrderId: string;

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder: SalesOrder;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
