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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PasswordService } from '../../common/services/password.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from './entities/user.entity';
import { ensureCanAccessResource } from '../../common/helpers/rbac.helper';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    // Validate test_technician_type if role is TEST_TECHNICIAN
    if (createUserDto.role === UserRole.TEST_TECHNICIAN && !createUserDto.testTechnicianType) {
      throw new BadRequestException('test_technician_type is required for TEST_TECHNICIAN role');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(createUserDto.password);

    // Create user
    const user = await this.usersService.create({
      email: createUserDto.email,
      passwordHash: hashedPassword,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
      testTechnicianType: createUserDto.testTechnicianType || null,
      isActive: true,
    });

    // Log action in audit_logs
    await this.auditService.log(
      null, // Creator ID (system or super admin context not available here directly, but usually from request.user)
      'CREATE_USER',
      'USER',
      user.id,
      { email: user.email, role: user.role },
      null, // IP address would need Request object
      null, // User agent would need Request object
    );

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  async findAll(
    @Query() query: QueryUsersDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<PaginatedUsersResponseDto> {
    const result = await this.usersService.findAllPaginated(query, currentUser.userId, currentUser.role as UserRole);

    // Remove passwordHash from all users
    const usersWithoutPassword = result.data.map((user: User) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword as Omit<User, 'passwordHash'>;
    });

    return {
      data: usersWithoutPassword,
      meta: result.meta,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get user by ID (SUPER_ADMIN or own profile)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Check if user can access this resource
    ensureCanAccessResource(currentUser, id);

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user (SUPER_ADMIN or own profile with limited fields)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Check if user can access this resource
    ensureCanAccessResource(currentUser, id);

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Non-SUPER_ADMIN users can only update limited fields
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      // Remove fields that only SUPER_ADMIN can update
      delete updateUserDto.role;
      delete updateUserDto.isActive;
      delete updateUserDto.testTechnicianType;
    }

    // Validate test_technician_type if role is being set to TEST_TECHNICIAN
    if (updateUserDto.role === UserRole.TEST_TECHNICIAN && !updateUserDto.testTechnicianType) {
      throw new BadRequestException('test_technician_type is required for TEST_TECHNICIAN role');
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);

    // Log changes in audit_logs
    await this.auditService.log(
      currentUser.userId,
      'UPDATE_USER',
      'USER',
      id,
      updateUserDto,
      null,
      null,
    );

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (SUPER_ADMIN only, soft delete)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete own account' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<{ message: string }> {
    // Cannot delete own account
    if (currentUser.userId === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.usersService.softDelete(id);

    // Log action in audit_logs
    await this.auditService.log(
      currentUser.userId,
      'DELETE_USER',
      'USER',
      id,
      null,
      null,
      null,
    );

    return { message: 'User deleted successfully' };
  }

  @Post(':id/change-password')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password (own profile or SUPER_ADMIN)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<{ message: string }> {
    // Check if user can access this resource
    ensureCanAccessResource(currentUser, id);

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Verify current password (unless SUPER_ADMIN is changing someone else's password)
    if (currentUser.userId === id || currentUser.role !== UserRole.SUPER_ADMIN) {
      const isPasswordValid = await this.passwordService.comparePassword(
        changePasswordDto.currentPassword,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Invalid current password');
      }
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(changePasswordDto.newPassword);

    // Update password
    await this.usersService.changePassword(id, newPasswordHash);

    // Log action in audit_logs
    await this.auditService.log(
      currentUser.userId,
      'CHANGE_PASSWORD',
      'USER',
      id,
      null,
      null,
      null,
    );

    return { message: 'Password changed successfully' };
  }
}

