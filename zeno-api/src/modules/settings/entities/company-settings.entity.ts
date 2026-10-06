import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { GstActiveLevel } from '../../../common/enums';

@Entity('company_settings')
@Unique(['companyId'])
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({
    name: 'gst_active_level',
    type: 'enum',
    enum: GstActiveLevel,
    default: GstActiveLevel.ITEM,
  })
  gstActiveLevel: GstActiveLevel;

  @Column({ name: 'default_purchase_ledger_id', type: 'uuid', nullable: true })
  defaultPurchaseLedgerId: string;

  @Column({ name: 'default_sales_ledger_id', type: 'uuid', nullable: true })
  defaultSalesLedgerId: string;

  @Column({ name: 'default_cgst_input_ledger_id', type: 'uuid', nullable: true })
  defaultCgstInputLedgerId: string;

  @Column({ name: 'default_sgst_input_ledger_id', type: 'uuid', nullable: true })
  defaultSgstInputLedgerId: string;

  @Column({ name: 'default_igst_input_ledger_id', type: 'uuid', nullable: true })
  defaultIgstInputLedgerId: string;

  @Column({ name: 'default_cgst_output_ledger_id', type: 'uuid', nullable: true })
  defaultCgstOutputLedgerId: string;

  @Column({ name: 'default_sgst_output_ledger_id', type: 'uuid', nullable: true })
  defaultSgstOutputLedgerId: string;

  @Column({ name: 'default_igst_output_ledger_id', type: 'uuid', nullable: true })
  defaultIgstOutputLedgerId: string;

  @Column({ name: 'default_cess_input_ledger_id', type: 'uuid', nullable: true })
  defaultCessInputLedgerId: string;

  @Column({ name: 'default_discount_ledger_id', type: 'uuid', nullable: true })
  defaultDiscountLedgerId: string;

  @Column({ name: 'default_round_off_ledger_id', type: 'uuid', nullable: true })
  defaultRoundOffLedgerId: string;

  @Column({ name: 'default_cash_ledger_id', type: 'uuid', nullable: true })
  defaultCashLedgerId: string;

  @Column({ name: 'default_bank_ledger_id', type: 'uuid', nullable: true })
  defaultBankLedgerId: string;

  @Column({ name: 'default_discount_allowed_ledger_id', type: 'uuid', nullable: true })
  defaultDiscountAllowedLedgerId: string;

  @Column({ name: 'default_discount_received_ledger_id', type: 'uuid', nullable: true })
  defaultDiscountReceivedLedgerId: string;

  @Column({ name: 'default_sales_return_ledger_id', type: 'uuid', nullable: true })
  defaultSalesReturnLedgerId: string;

  @Column({ name: 'default_purchase_return_ledger_id', type: 'uuid', nullable: true })
  defaultPurchaseReturnLedgerId: string;

  @Column({ name: 'default_freight_ledger_id', type: 'uuid', nullable: true })
  defaultFreightLedgerId: string;

  @Column({ name: 'voucher_config', type: 'jsonb', nullable: true })
  voucherConfig: Record<string, any>;

  @Column({ name: 'sales_settings', type: 'jsonb', nullable: true })
  salesSettings: Record<string, any>;

  @Column({ name: 'purchase_settings', type: 'jsonb', nullable: true })
  purchaseSettings: Record<string, any>;

  @Column({ name: 'inventory_settings', type: 'jsonb', nullable: true })
  inventorySettings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
