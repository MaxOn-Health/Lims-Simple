import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { AdminRolesService } from './admin-roles.service';
import { CreateAdminRoleDto, UpdateAdminRoleDto, AdminRoleResponseDto } from './dto/admin-role.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin Roles')
@Controller('admin-roles')
@ApiBearerAuth('JWT-auth')
export class AdminRolesController {
    constructor(private readonly adminRolesService: AdminRolesService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new admin role (SUPER_ADMIN only)' })
    @ApiResponse({ status: 201, description: 'Admin role created successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
    @ApiResponse({ status: 409, description: 'Role name already exists' })
    async create(@Body() createDto: CreateAdminRoleDto): Promise<AdminRoleResponseDto> {
        return this.adminRolesService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all admin roles' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'List of admin roles' })
    async findAll(
        @Query('includeInactive') includeInactive?: string,
    ): Promise<AdminRoleResponseDto[]> {
        return this.adminRolesService.findAll(includeInactive === 'true');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get admin role by ID' })
    @ApiParam({ name: 'id', description: 'Admin role ID' })
    @ApiResponse({ status: 200, description: 'Admin role details' })
    @ApiResponse({ status: 404, description: 'Admin role not found' })
    async findOne(@Param('id') id: string): Promise<AdminRoleResponseDto> {
        return this.adminRolesService.findById(id);
    }

    @Put(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update admin role (SUPER_ADMIN only)' })
    @ApiParam({ name: 'id', description: 'Admin role ID' })
    @ApiResponse({ status: 200, description: 'Admin role updated successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
    @ApiResponse({ status: 404, description: 'Admin role not found' })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateAdminRoleDto,
    ): Promise<AdminRoleResponseDto> {
        return this.adminRolesService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete admin role (SUPER_ADMIN only, soft delete)' })
    @ApiParam({ name: 'id', description: 'Admin role ID' })
    @ApiResponse({ status: 200, description: 'Admin role deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
    @ApiResponse({ status: 404, description: 'Admin role not found' })
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        await this.adminRolesService.delete(id);
        return { message: 'Admin role deleted successfully' };
    }
}
