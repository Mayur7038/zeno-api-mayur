"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const role_entity_1 = require("./entities/role.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const user_branch_access_entity_1 = require("./entities/user-branch-access.entity");
const rbac_service_1 = require("./services/rbac.service");
const rbac_controller_1 = require("./controllers/rbac.controller");
const user_entity_1 = require("../auth/entities/user.entity");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([role_entity_1.Role, role_permission_entity_1.RolePermission, user_branch_access_entity_1.UserBranchAccess, user_entity_1.User])],
        controllers: [rbac_controller_1.RbacController],
        providers: [rbac_service_1.RbacService],
        exports: [rbac_service_1.RbacService, typeorm_1.TypeOrmModule],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map