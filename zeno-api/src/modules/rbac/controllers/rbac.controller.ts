import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from '../services/rbac.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionAction, PermissionModule } from '../../../common/enums';

@ApiTags('RBAC & User Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('rbac')
export class RbacController {
  constructor(private rbacService: RbacService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles and permissions for tenant' })
  async getRoles(@CurrentTenant() tenantId: string) {
    return this.rbacService.getRoles(tenantId);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create custom role with permissions' })
  async createRole(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; description: string; permissions: any[] },
  ) {
    return this.rbacService.createRole(
      tenantId,
      body.name,
      body.description,
      body.permissions,
    );
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Update custom role and permissions' })
  async updateRole(
    @CurrentTenant() tenantId: string,
    @Param('id') roleId: string,
    @Body() body: { name?: string; description?: string; permissions?: any[] },
  ) {
    return this.rbacService.updateRole(
      tenantId,
      roleId,
      body.name,
      body.description,
      body.permissions,
    );
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete custom role' })
  async deleteRole(
    @CurrentTenant() tenantId: string,
    @Param('id') roleId: string,
  ) {
    return this.rbacService.deleteRole(tenantId, roleId);
  }

  @Post('assign-branch')
  @RequirePermissions({ module: PermissionModule.USERS, action: PermissionAction.EDIT })
  @ApiOperation({ summary: 'Assign user to branch' })
  async assignBranch(
    @Body() body: { userId: string; branchId: string; isDefault?: boolean },
  ) {
    return this.rbacService.assignUserBranch(
      body.userId,
      body.branchId,
      body.isDefault,
    );
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all tenant users with assigned roles' })
  async getUsers(@CurrentTenant() tenantId: string) {
    return this.rbacService.getUsers(tenantId);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create user with role' })
  async createUser(
    @CurrentTenant() tenantId: string,
    @Body() body: { fullName: string; email: string; phone?: string; roleId?: string },
  ) {
    return this.rbacService.createUser(tenantId, body);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user role or active status' })
  async updateUser(
    @CurrentTenant() tenantId: string,
    @Param('id') userId: string,
    @Body() body: { roleId?: string; isActive?: boolean },
  ) {
    return this.rbacService.updateUserRole(tenantId, userId, body.roleId, body.isActive);
  }
}
