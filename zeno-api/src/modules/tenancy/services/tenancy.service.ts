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

  async updateCompany(tenantId: string, companyId: string, data: Partial<Company>) {
    const company = await this.companyRepo.findOne({
      where: { tenantId, id: companyId },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    Object.assign(company, data);
    return this.companyRepo.save(company);
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
    const branch = this.branchRepo.create({ ...data, tenantId });
    return this.branchRepo.save(branch);
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
