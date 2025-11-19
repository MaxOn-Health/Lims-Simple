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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackagesDto } from './dto/query-packages.dto';
import { AddTestToPackageDto } from './dto/add-test-to-package.dto';
import { PackageResponseDto, PackageTestResponseDto } from './dto/package-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Package } from './entities/package.entity';

@ApiTags('Packages')
@Controller('packages')
@ApiBearerAuth('JWT-auth')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new package (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Package created successfully',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Package name already exists' })
  async create(@Body() createPackageDto: CreatePackageDto): Promise<Package> {
    return this.packagesService.create(createPackageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all packages (all authenticated users)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status (true/false)' })
  @ApiResponse({
    status: 200,
    description: 'List of packages',
    type: [PackageResponseDto],
  })
  async findAll(@Query() query: QueryPackagesDto): Promise<Package[]> {
    return this.packagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID with associated tests' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package details with tests',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async findOne(@Param('id') id: string): Promise<PackageResponseDto> {
    const pkg = await this.packagesService.findById(id);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Transform to response DTO
    const tests: PackageTestResponseDto[] = pkg.packageTests?.map((pt) => ({
      id: pt.id,
      testId: pt.testId,
      testName: pt.test.name,
      testPrice: pt.testPrice,
      createdAt: pt.createdAt,
    })) || [];

    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      validityDays: pkg.validityDays,
      isActive: pkg.isActive,
      tests,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update package (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package updated successfully',
    type: PackageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiResponse({ status: 409, description: 'Package name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ): Promise<Package> {
    return this.packagesService.update(id, updatePackageDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete package (SUPER_ADMIN only, soft delete)' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Package deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Package deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.packagesService.softDelete(id);
    return { message: 'Package deleted successfully' };
  }

  @Post(':id/tests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add test to package (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'Test added to package successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test added to package successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Package or test not found' })
  @ApiResponse({ status: 409, description: 'Test already in package' })
  async addTest(
    @Param('id') id: string,
    @Body() addTestDto: AddTestToPackageDto,
  ): Promise<{ message: string }> {
    await this.packagesService.addTestToPackage(id, addTestDto);
    return { message: 'Test added to package successfully' };
  }

  @Delete(':id/tests/:testId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove test from package (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Test removed from package successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test removed from package successfully' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Package or test not found' })
  async removeTest(
    @Param('id') id: string,
    @Param('testId') testId: string,
  ): Promise<{ message: string }> {
    await this.packagesService.removeTestFromPackage(id, testId);
    return { message: 'Test removed from package successfully' };
  }

  @Get(':id/tests')
  @ApiOperation({ summary: 'Get all tests in a package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({
    status: 200,
    description: 'List of tests in package',
    type: [PackageTestResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async getPackageTests(@Param('id') id: string): Promise<PackageTestResponseDto[]> {
    const packageTests = await this.packagesService.getPackageTests(id);
    return packageTests.map((pt) => ({
      id: pt.id,
      testId: pt.testId,
      testName: pt.test.name,
      testPrice: pt.testPrice,
      createdAt: pt.createdAt,
    }));
  }
}

