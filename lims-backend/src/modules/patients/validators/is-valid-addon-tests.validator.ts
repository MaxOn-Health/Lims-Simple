import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../../tests/entities/test.entity';

// This validator needs to be async and check database
// We'll use a custom constraint approach
@Injectable()
export class IsValidAddonTestsConstraint {
  constructor(
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
  ) {}

  async validate(addonTestIds: string[] | undefined): Promise<boolean> {
    if (!addonTestIds || addonTestIds.length === 0) {
      return true; // Optional field, empty array is valid
    }

    // Check if all test IDs exist and are active
    const tests = await this.testsRepository.find({
      where: addonTestIds.map((id) => ({ id, isActive: true })),
    });

    return tests.length === addonTestIds.length;
  }
}

// For DTO validation, we'll use a simpler synchronous validator
// The actual validation will be done in the service layer
export function IsValidAddonTests(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidAddonTests',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Basic validation - check if it's an array of strings
          if (!value || !Array.isArray(value)) {
            return true; // Optional field
          }
          return value.every((id: any) => typeof id === 'string' && id.length > 0);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an array of valid test IDs`;
        },
      },
    });
  };
}

