"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RackBin = void 0;
const typeorm_1 = require("typeorm");
const godown_entity_1 = require("./godown.entity");
let RackBin = class RackBin {
    id;
    tenantId;
    godownId;
    godown;
    rackCode;
    binCode;
    createdAt;
    updatedAt;
};
exports.RackBin = RackBin;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RackBin.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'tenant_id', type: 'uuid' }),
    __metadata("design:type", String)
], RackBin.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'godown_id', type: 'uuid' }),
    __metadata("design:type", String)
], RackBin.prototype, "godownId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => godown_entity_1.Godown, (godown) => godown.racksBins, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'godown_id' }),
    __metadata("design:type", godown_entity_1.Godown)
], RackBin.prototype, "godown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rack_code', length: 50 }),
    __metadata("design:type", String)
], RackBin.prototype, "rackCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bin_code', length: 50 }),
    __metadata("design:type", String)
], RackBin.prototype, "binCode", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RackBin.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RackBin.prototype, "updatedAt", void 0);
exports.RackBin = RackBin = __decorate([
    (0, typeorm_1.Entity)('racks_bins')
], RackBin);
//# sourceMappingURL=rack-bin.entity.js.map