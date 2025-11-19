'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createPatientSchema } from '@/utils/validation/patient-schemas';
import { CreatePatientRequest, Gender } from '@/types/patient.types';
import { Package } from '@/types/package.types';
import { Test } from '@/types/test.types';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { patientsService } from '@/services/api/patients.service';
import { packagesService } from '@/services/api/packages.service';
import { testsService } from '@/services/api/tests.service';
import { projectsService } from '@/services/api/projects.service';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types/user.types';
import { Project } from '@/types/project.types';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import { PatientIdDisplay } from '../PatientIdDisplay/PatientIdDisplay';
import { IndianRupee } from 'lucide-react';

interface PatientFormProps {
  onSuccess?: (patientId: string) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePatientRequest>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      addonTestIds: [],
    },
  });

  const selectedPackageId = watch('packageId');
  const selectedProjectId = watch('projectId');
  const selectedAddonTestIds = watch('addonTestIds') || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesData, testsData] = await Promise.all([
          packagesService.getPackages({ isActive: true }),
          testsService.getTests({ isActive: true }),
        ]);
        setPackages(packagesData);
        setTests(testsData);
      } catch (err) {
        const apiError = err as ApiError;
        addToast({
          type: 'error',
          message: getErrorMessage(apiError),
        });
      } finally {
        setIsLoadingPackages(false);
        setIsLoadingTests(false);
      }
    };

    fetchData();
  }, [addToast]);

  // Fetch active projects for receptionists
  useEffect(() => {
    if (user?.role === UserRole.RECEPTIONIST) {
      const fetchProjects = async () => {
        setIsLoadingProjects(true);
        try {
          const activeProjects = await projectsService.getActiveProjects();
          setProjects(activeProjects);
        } catch (err) {
          const apiError = err as ApiError;
          addToast({
            type: 'error',
            message: getErrorMessage(apiError) || 'Failed to load projects',
          });
        } finally {
          setIsLoadingProjects(false);
        }
      };

      fetchProjects();
    }
  }, [user?.role, addToast]);

  // Watch for project selection and auto-populate fields
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      if (project) {
        setSelectedProject(project);
        
        // Auto-populate company name if not already set
        const currentCompanyName = watch('companyName');
        if (!currentCompanyName && project.companyName) {
          setValue('companyName', project.companyName);
        }

        // Set default package if project has one
        if (project.campSettings?.defaultPackageId && !selectedPackageId) {
          setValue('packageId', project.campSettings.defaultPackageId);
        }
      } else {
        setSelectedProject(null);
      }
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId, projects, watch, setValue, selectedPackageId]);

  const selectedPackage = useMemo(() => {
    return packages.find((pkg) => pkg.id === selectedPackageId);
  }, [packages, selectedPackageId]);

  const selectedAddonTests = useMemo(() => {
    return tests.filter((test) => selectedAddonTestIds.includes(test.id));
  }, [tests, selectedAddonTestIds]);

  const packagePrice = selectedPackage?.price || 0;
  const addonTestsTotal = useMemo(() => {
    // Note: Tests don't have individual prices in the current schema
    // The backend calculates addon test prices separately
    // For now, we'll show 0 for addon tests total
    return 0;
  }, [selectedAddonTests]);

  const grandTotal = packagePrice + addonTestsTotal;

  const onSubmit = async (data: CreatePatientRequest) => {
    try {
      const patient = await patientsService.registerPatient(data);
      setCreatedPatientId(patient.patientId);
      addToast({
        type: 'success',
        message: 'Patient registered successfully',
      });
      if (onSuccess) {
        onSuccess(patient.patientId);
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  if (createdPatientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Registered Successfully</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PatientIdDisplay patientId={createdPatientId} />
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => router.push('/patients')}>
              View All Patients
            </Button>
            <Button variant="outline" onClick={() => router.push('/patients/new')}>
              Register Another Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              id="name"
              label="Full Name"
              placeholder="Enter patient name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="age"
                type="number"
                label="Age"
                placeholder="Enter age"
                required
                error={errors.age?.message}
                {...register('age', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-sm font-medium text-destructive">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="contactNumber"
                label="Contact Number"
                placeholder="Enter contact number"
                required
                error={errors.contactNumber?.message}
                {...register('contactNumber')}
              />
            </div>

            <div>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="Enter email (optional)"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="employeeId"
                label="Employee ID"
                placeholder="Enter employee ID (optional)"
                error={errors.employeeId?.message}
                {...register('employeeId')}
              />
            </div>

          <div>
            <Input
              id="companyName"
              label="Company Name"
              placeholder="Enter company name (optional)"
              error={errors.companyName?.message}
              {...register('companyName')}
              disabled={!!selectedProject?.companyName}
            />
            {selectedProject?.companyName && (
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-filled from project
              </p>
            )}
          </div>
        </div>

        {/* Project Selection (for Receptionists) */}
        {user?.role === UserRole.RECEPTIONIST && (
          <div className="space-y-2">
            <Label htmlFor="projectId">Project (Optional)</Label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || 'all'}
                  onValueChange={(value) => field.onChange(value === 'all' ? undefined : value)}
                  disabled={isLoadingProjects}
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Select a project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.companyName && ` - ${project.companyName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.projectId && (
              <p className="text-sm font-medium text-destructive">{errors.projectId.message}</p>
            )}
            {selectedProject && (
              <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                <p className="font-medium">{selectedProject.name}</p>
                {selectedProject.campSettings?.requireEmployeeId && (
                  <p className="text-orange-600">
                    ⚠️ Employee ID is required for this project
                  </p>
                )}
                {selectedProject.campSettings?.patientIdPrefix && (
                  <p className="text-muted-foreground">
                    Patient IDs will be prefixed with: {selectedProject.campSettings.patientIdPrefix}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Employee ID requirement warning */}
        {selectedProject?.campSettings?.requireEmployeeId && !watch('employeeId') && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-sm text-orange-800 font-medium">
              ⚠️ Employee ID is required for this project
            </p>
          </div>
        )}

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter address (optional)"
              rows={3}
              {...register('address')}
            />
            {errors.address && (
              <p className="mt-1 text-sm font-medium text-destructive">{errors.address.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Package Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Package Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="packageId">Package *</Label>
            <Controller
              name="packageId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingPackages}
                >
                  <SelectTrigger id="packageId">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - ₹{Number(pkg.price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.packageId && (
              <p className="text-sm font-medium text-destructive">{errors.packageId.message}</p>
            )}
          </div>

          {selectedPackage && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Package Price</span>
                <div className="flex items-baseline gap-1">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold text-foreground">
                    {Number(selectedPackage.price).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Validity: {selectedPackage.validityDays} days</p>
                {selectedPackage.description && (
                  <p className="mt-1">{selectedPackage.description}</p>
                )}
                {selectedPackage.tests && selectedPackage.tests.length > 0 && (
                  <p className="mt-1">
                    Includes {selectedPackage.tests.length} test{selectedPackage.tests.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Addon Tests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Addon Tests (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingTests ? (
            <p className="text-sm text-muted-foreground">Loading tests...</p>
          ) : tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tests available</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-4">
              {tests.map((test) => (
                <div key={test.id} className="flex items-start space-x-3">
                  <Controller
                    name="addonTestIds"
                    control={control}
                    render={({ field }) => {
                      const isChecked = field.value?.includes(test.id) || false;
                      return (
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentIds = field.value || [];
                            if (checked) {
                              field.onChange([...currentIds, test.id]);
                            } else {
                              field.onChange(currentIds.filter((id) => id !== test.id));
                            }
                          }}
                        />
                      );
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={test.id} className="font-medium cursor-pointer">
                      {test.name}
                    </Label>
                    {test.description && (
                      <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedAddonTests.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">Selected Tests:</p>
              <ul className="list-disc list-inside space-y-1">
                {selectedAddonTests.map((test) => (
                  <li key={test.id} className="text-sm text-foreground">
                    {test.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Package Price</span>
              <div className="flex items-baseline gap-1">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {packagePrice.toFixed(2)}
                </span>
              </div>
            </div>

            {selectedAddonTests.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Addon Tests ({selectedAddonTests.length})
                  </span>
                  <div className="flex items-baseline gap-1">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {addonTestsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">Grand Total</span>
              <div className="flex items-baseline gap-1">
                <IndianRupee className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Register Patient
        </Button>
      </div>
    </form>
  );
};

