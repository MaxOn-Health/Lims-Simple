import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Test, TestField } from '../../modules/tests/entities/test.entity';
import { TestCategory } from '../../modules/tests/constants/test-category';
import { TestFieldType } from '../../modules/tests/constants/test-field-types';
import * as path from 'path';

config();

const dataSourceOptions: any = {
  type: 'postgres',
  entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: true,
};

if (process.env.DATABASE_URL) {
  dataSourceOptions.url = process.env.DATABASE_URL;
  dataSourceOptions.ssl = {
    rejectUnauthorized: false,
  };
} else {
  dataSourceOptions.host = process.env.DATABASE_HOST || 'localhost';
  dataSourceOptions.port = parseInt(process.env.DATABASE_PORT, 10) || 5432;
  dataSourceOptions.username = process.env.DATABASE_USERNAME || process.env.USER || 'postgres';
  dataSourceOptions.password = process.env.DATABASE_PASSWORD || '';
  dataSourceOptions.database = process.env.DATABASE_NAME || 'lims_db';
}

const dataSource = new DataSource(dataSourceOptions);

export async function seedTests(dataSource: DataSource): Promise<void> {
  const testRepository = dataSource.getRepository(Test);

  // Define Audiometry Test
  const audiometryTestData = {
    name: 'Audiometry Test',
    description: 'Hearing test for both ears at multiple frequencies (125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000 Hz)',
    category: TestCategory.ON_SITE,
    adminRole: 'audiometry',
    normalRangeMin: -10,
    normalRangeMax: 25,
    unit: 'dB HL',
    testFields: [
      // Right ear frequencies
      { field_name: 'right_125', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_250', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_500', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_750', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_1000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_1500', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_2000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_3000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_4000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_6000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'right_8000', field_type: TestFieldType.NUMBER, required: false, options: null },
      // Left ear frequencies
      { field_name: 'left_125', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_250', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_500', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_750', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_1000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_1500', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_2000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_3000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_4000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_6000', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'left_8000', field_type: TestFieldType.NUMBER, required: false, options: null },
    ] as TestField[],
    isActive: true,
  };

  // Check if Audiometry Test already exists
  const existingAudiometryTest = await testRepository.findOne({
    where: { name: audiometryTestData.name },
  });

  if (existingAudiometryTest) {
    console.log('Audiometry Test already exists. Updating...');
    // Update existing test
    Object.assign(existingAudiometryTest, audiometryTestData);
    await testRepository.save(existingAudiometryTest);
    console.log('Audiometry Test updated successfully');
  } else {
    // Create new test
    const audiometryTest = testRepository.create(audiometryTestData);
    await testRepository.save(audiometryTest);
    console.log('Audiometry Test created successfully');
  }

  console.log('Test name:', audiometryTestData.name);
  console.log('Admin role:', audiometryTestData.adminRole);
  console.log('Test fields count:', audiometryTestData.testFields.length);

  // Define Eye Test with complete field structure matching UI expectations
  const eyeTestData = {
    name: 'Eye Test',
    description: 'Vision test with distance/near vision, eye parameters, and eye health',
    category: TestCategory.ON_SITE,
    adminRole: 'eye_test',
    normalRangeMin: 6,
    normalRangeMax: 6,
    unit: 'meters',
    testFields: [
      // Vision fields (8 fields: 2 vision types × 2 eyes × 2 glass types)
      // Distance vision
      { field_name: 'distance_vision_right_without_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'distance_vision_right_with_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'distance_vision_left_without_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'distance_vision_left_with_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      // Near vision
      { field_name: 'near_vision_right_without_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'near_vision_right_with_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'near_vision_left_without_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'near_vision_left_with_glass', field_type: TestFieldType.NUMBER, required: false, options: null },
      // Eye parameters (10 fields: 5 parameters × 2 eyes)
      { field_name: 'sph_right', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'cyl_right', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'axis_right', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'add_right', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'vision_right', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'sph_left', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'cyl_left', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'axis_left', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'add_left', field_type: TestFieldType.NUMBER, required: false, options: null },
      { field_name: 'vision_left', field_type: TestFieldType.NUMBER, required: false, options: null },
      // Eye health (5 fields)
      { field_name: 'eye_lids', field_type: TestFieldType.TEXT, required: false, options: null },
      { field_name: 'conjunctiva', field_type: TestFieldType.TEXT, required: false, options: null },
      { field_name: 'cornea', field_type: TestFieldType.TEXT, required: false, options: null },
      { field_name: 'pupil', field_type: TestFieldType.TEXT, required: false, options: null },
      { field_name: 'colour_blindness', field_type: TestFieldType.TEXT, required: false, options: null },
      // Vision status (2 fields)
      { field_name: 'normal_vision', field_type: TestFieldType.TEXT, required: false, options: null },
      { field_name: 'near_normal_vision', field_type: TestFieldType.TEXT, required: false, options: null },
    ] as TestField[],
    isActive: true,
  };

  // Check if Eye Test already exists
  const existingEyeTest = await testRepository.findOne({
    where: { name: eyeTestData.name },
  });

  if (existingEyeTest) {
    console.log('Eye Test already exists. Updating...');
    // Update existing test
    Object.assign(existingEyeTest, eyeTestData);
    await testRepository.save(existingEyeTest);
    console.log('Eye Test updated successfully');
  } else {
    // Create new test
    const eyeTest = testRepository.create(eyeTestData);
    await testRepository.save(eyeTest);
    console.log('Eye Test created successfully');
  }

  console.log('Eye Test name:', eyeTestData.name);
  console.log('Eye Test admin role:', eyeTestData.adminRole);
  console.log('Eye Test fields count:', eyeTestData.testFields.length);
}

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await seedTests(dataSource);

    await dataSource.destroy();
    console.log('Seed completed');
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

runSeed();

