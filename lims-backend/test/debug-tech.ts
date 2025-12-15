
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Test } from '../src/modules/tests/entities/test.entity';
import { Assignment } from '../src/modules/assignments/entities/assignment.entity';
import { Patient } from '../src/modules/patients/entities/patient.entity';
import { PatientPackage } from '../src/modules/patients/entities/patient-package.entity';
import { Package } from '../src/modules/packages/entities/package.entity';
import { PackageTest } from '../src/modules/packages/entities/package-test.entity';
import { Project } from '../src/modules/projects/entities/project.entity';
import { ProjectMember } from '../src/modules/projects/entities/project-member.entity';
import { TestResult } from '../src/modules/results/entities/test-result.entity';
import { BloodSample } from '../src/modules/blood-samples/entities/blood-sample.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function checkTechnician() {
    const dataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [
            User, Test, Assignment,
            Patient, PatientPackage,
            Package, PackageTest,
            Project, ProjectMember,
            TestResult, BloodSample
        ],
        synchronize: false,
        ssl: { rejectUnauthorized: false }, // For Supabase
    });

    try {
        await dataSource.initialize();
        console.log('Database connected');

        const userRepository = dataSource.getRepository(User);
        const testRepository = dataSource.getRepository(Test);
        const assignmentRepository = dataSource.getRepository(Assignment);
        const patientRepository = dataSource.getRepository(Patient);
        const projectMemberRepository = dataSource.getRepository(ProjectMember);

        // 1. Check Technician
        console.log('Checking for xray@lims.com...');
        const user = await userRepository.findOne({
            where: { email: 'xray@lims.com' },
        });

        if (user) {
            console.log('User found:', {
                id: user.id,
                email: user.email,
                role: user.role,
                testTechnicianType: user.testTechnicianType,
                isActive: user.isActive,
            });

            // 4. Check Project Membership
            console.log('\nChecking Project Membership for xray@lims.com...');
            const members = await projectMemberRepository.find({
                where: { userId: user.id },
                relations: ['project']
            });

            console.log(`User is member of ${members.length} projects.`);
            members.forEach(m => console.log(`  - ${m.project?.name} (${m.role})`));

            if (members.length === 0) {
                console.log('User has NO project memberships. This likely triggers the empty return bug in findByAdmin.');
            }

        } else {
            console.log('User xray@lims.com NOT found!');
        }

        // 2. Check Test Definition
        console.log('\nChecking Test "X-Ray Chest"...');
        const test = await testRepository.findOne({
            where: { name: 'X-Ray Chest' }
        });

        if (test) {
            console.log('Test found:', {
                id: test.id,
                name: test.name,
                adminRole: test.adminRole,
                isActive: test.isActive,
            });
        }

        // 3. Check Created Assignments
        console.log('\nChecking Recent Assignments...');

        // Get latest patient
        const latestPatient = await patientRepository.findOne({
            where: {},
            order: { createdAt: 'DESC' },
            relations: ['patientPackages', 'patientPackages.package']
        });

        if (latestPatient) {
            console.log('Latest Patient:', {
                id: latestPatient.id,
                name: latestPatient.name,
                createdAt: latestPatient.createdAt,
                packageCount: latestPatient.patientPackages?.length,
                addonTestIds: latestPatient.patientPackages?.[0]?.addonTestIds
            });

            const assignments = await assignmentRepository.find({
                where: { patientId: latestPatient.id },
                relations: ['test', 'admin']
            });

            console.log(`Found ${assignments.length} assignments for this patient.`);
            assignments.forEach((a: Assignment) => {
                console.log(`  - Assignment ${a.id}: Test '${a.test?.name}', Status ${a.status}, Admin: ${a.admin?.email || 'UNASSIGNED'} (AdminID: ${a.adminId})`);
            });
        } else {
            console.log('No patients found.');
        }

        await dataSource.destroy();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTechnician();
