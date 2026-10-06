import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountingVoucherLineDto {
  @ApiProperty({ description: 'Target ledger account UUID' })
  @IsString()
  @IsNotEmpty()
  ledgerId: string;

  @ApiPropertyOptional({ description: 'Debit amount in INR', default: 0 })
  @IsNumber()
  @IsOptional()
  debitAmount?: number;

  @ApiPropertyOptional({ description: 'Credit amount in INR', default: 0 })
  @IsNumber()
  @IsOptional()
  creditAmount?: number;

  @ApiPropertyOptional({ description: 'Direct line amount (convenience for single-entry payment/receipt)' })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Line-level narration / remark' })
  @IsString()
  @IsOptional()
  narration?: string;
}

export class CreateAccountingVoucherDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Branch UUID' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    description: 'Voucher Type',
    enum: ['PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE'],
  })
  @IsString()
  @IsIn(['PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE'])
  voucherType: 'PAYMENT' | 'RECEIPT' | 'CONTRA' | 'JOURNAL' | 'DEBIT_NOTE' | 'CREDIT_NOTE';

  @ApiProperty({ description: 'Voucher posting date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  voucherDate: string;

  @ApiPropertyOptional({
    description: 'Payment mode',
    enum: ['CASH', 'CHEQUE', 'NEFT_RTGS', 'UPI', 'NET_BANKING', 'OTHER'],
    default: 'CASH',
  })
  @IsString()
  @IsOptional()
  paymentMode?: string;

  @ApiPropertyOptional({ description: 'Cheque/UTR/Reference No' })
  @IsString()
  @IsOptional()
  referenceNo?: string;

  @ApiPropertyOptional({ description: 'Instrument/Reference Date' })
  @IsString()
  @IsOptional()
  referenceDate?: string;

  @ApiPropertyOptional({ description: 'Voucher overall narration' })
  @IsString()
  @IsOptional()
  narration?: string;

  @ApiPropertyOptional({
    description: 'Source Cash/Bank ledger for Payment/Receipt/Contra, or Party ledger for Debit/Credit note',
  })
  @IsString()
  @IsOptional()
  sourceAccountLedgerId?: string;

  @ApiPropertyOptional({ description: 'Destination Cash/Bank ledger for Contra transfer' })
  @IsString()
  @IsOptional()
  destinationLedgerId?: string;

  @ApiPropertyOptional({ description: 'Total voucher amount' })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({ description: 'Itemized debit/credit lines', type: [AccountingVoucherLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingVoucherLineDto)
  lines: AccountingVoucherLineDto[];
}
