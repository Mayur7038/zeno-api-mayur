import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { Branch } from '../entities/branch.entity';
import { Godown } from '../entities/godown.entity';
import { RackBin } from '../entities/rack-bin.entity';

@Injectable()
export class TenancyService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
    @InjectRepository(Godown)
    private godownRepo: Repository<Godown>,
    @InjectRepository(RackBin)
    private rackBinRepo: Repository<RackBin>,
  ) {}

  async getCompanies(tenantId: string) {
    return this.companyRepo.find({
      where: { tenantId },
      relations: ['branches'],
    });
  }

  async getBranches(tenantId: string, companyId?: string) {
    const where: any = { tenantId };
    if (companyId) where.companyId = companyId;
    return this.branchRepo.find({ where, relations: ['godowns'] });
  }

  async updateCompany(tenantId: string, companyId: string, data: any) {
    const company = await this.companyRepo.findOne({
      where: { tenantId, id: companyId },
      relations: ['branches'],
    });
    if (!company) {
      throw new Error('Company not found');
    }

    // Clean up empty date strings so PostgreSQL doesn't fail on invalid date syntax
    if (data.financialYearEnd === '') data.financialYearEnd = null;
    if (data.financialYearStart === '') data.financialYearStart = '2025-04-01';
    if (data.booksBeginFrom === '') data.booksBeginFrom = '2025-04-01';

    // Store in extraDetails as fallback
    if (!company.extraDetails) company.extraDetails = {};
    if (data.extraDetails) {
      company.extraDetails = { ...company.extraDetails, ...data.extraDetails };
    }
    if (data.tanNumber) company.extraDetails.tanNumber = data.tanNumber;
    if (data.arnNumber) company.extraDetails.arnNumber = data.arnNumber;
    if (data.stateName) company.extraDetails.stateName = data.stateName;
    if (data.filingFrequency) company.extraDetails.filingFrequency = data.filingFrequency;

    // Sync default branch address with billing address if head branch exists
    if (data.billingAddress && company.branches && company.branches.length > 0) {
      const headBranch = company.branches.find((b) => b.isHeadOffice) || company.branches[0];
      if (headBranch) {
        if (data.billingAddress.addressLine1) headBranch.addressLine1 = data.billingAddress.addressLine1;
        if (data.billingAddress.pincode) headBranch.pincode = data.billingAddress.pincode;
        if (data.billingAddress.state) headBranch.stateName = data.billingAddress.state;
        await this.branchRepo.save(headBranch);
      }
    }

    // Prevent overwriting relations or primary keys
    delete data.branches;
    delete data.tenant;
    delete data.id;
    delete data.tenantId;

    Object.assign(company, data);
    await this.companyRepo.save(company);

    return this.companyRepo.findOne({
      where: { tenantId, id: companyId },
      relations: ['branches'],
    });
  }

  async getGodowns(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    return this.godownRepo.find({ where, relations: ['branch', 'racksBins'], order: { createdAt: 'ASC' } });
  }

  async getRacksBins(tenantId: string, godownId: string) {
    return this.rackBinRepo.find({ where: { tenantId, godownId } });
  }

  async createBranch(tenantId: string, data: Partial<Branch>) {
    if (!data.companyId) {
      const company = await this.companyRepo.findOne({ where: { tenantId } });
      if (company) {
        data.companyId = company.id;
      }
    }
    if (data.isHeadOffice && data.companyId) {
      await this.branchRepo.update({ tenantId, companyId: data.companyId }, { isHeadOffice: false });
    }
    const branch = this.branchRepo.create({ ...data, tenantId });
    return this.branchRepo.save(branch);
  }

  async updateBranch(tenantId: string, branchId: string, data: Partial<Branch>) {
    const branch = await this.branchRepo.findOne({
      where: { tenantId, id: branchId },
    });
    if (!branch) {
      throw new Error('Branch not found');
    }
    if (data.isHeadOffice && branch.companyId) {
      await this.branchRepo.update({ tenantId, companyId: branch.companyId }, { isHeadOffice: false });
    }
    delete (data as any).id;
    delete (data as any).tenantId;
    delete (data as any).company;
    delete (data as any).godowns;

    Object.assign(branch, data);
    return this.branchRepo.save(branch);
  }

  async deleteBranch(tenantId: string, branchId: string) {
    const branch = await this.branchRepo.findOne({
      where: { tenantId, id: branchId },
      relations: ['godowns'],
    });
    if (!branch) {
      throw new Error('Branch not found');
    }
    return this.branchRepo.remove(branch);
  }

  async createGodown(tenantId: string, data: Partial<Godown>) {
    const godown = this.godownRepo.create({ ...data, tenantId });
    return this.godownRepo.save(godown);
  }

  async updateGodown(tenantId: string, godownId: string, data: Partial<Godown>) {
    const godown = await this.godownRepo.findOne({
      where: { tenantId, id: godownId },
    });
    if (!godown) {
      throw new Error('Warehouse not found');
    }
    Object.assign(godown, data);
    return this.godownRepo.save(godown);
  }

  async deleteGodown(tenantId: string, godownId: string) {
    const godown = await this.godownRepo.findOne({
      where: { tenantId, id: godownId },
    });
    if (!godown) {
      throw new Error('Warehouse not found');
    }
    return this.godownRepo.remove(godown);
  }

  async createRackBin(tenantId: string, data: Partial<RackBin>) {
    const rackBin = this.rackBinRepo.create({ ...data, tenantId });
    return this.rackBinRepo.save(rackBin);
  }
}
