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
import { BarcodePrintDialog } from '@/components/common/Barcode/BarcodePrintDialog';

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

  // New state for barcode printing
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [lastRegisteredPatient, setLastRegisteredPatient] = useState<{ name: string, barcodeNumber: string } | null>(null);

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
        console.error('Failed to fetch tests for patient form:', apiError);
        console.error('Error details:', {
          message: getErrorMessage(apiError),
          // status: apiError?.statusCode, // using statusCode from ApiError interface if available
        });
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

  const packagePrice = Number(selectedPackage?.price || 0);
  const testsTotal = useMemo(() => {
    // Note: Tests don't have individual prices in the current schema
    // The backend calculates test prices separately
    // For now, we'll show 0 for individual test prices
    return 0;
  }, [selectedAddonTests]);

  const grandTotal = packagePrice + testsTotal;

  const onSubmit = async (data: CreatePatientRequest) => {
    try {
      const patient = await patientsService.registerPatient(data);
      setCreatedPatientId(patient.patientId);

      // Store patient details for barcode printing and open dialog if barcode exists
      if (patient.barcodeNumber) {
        setLastRegisteredPatient({
          name: patient.name,
          barcodeNumber: patient.barcodeNumber
        });
        setShowBarcodeDialog(true);
      }

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

          <div className="flex gap-3 flex-wrap">
            <Button variant="primary" onClick={() => router.push('/patients')}>
              View All Patients
            </Button>
            <Button variant="outline" onClick={() => router.push('/patients/new')}>
              Register Another Patient
            </Button>
            {lastRegisteredPatient && (
              <Button variant="secondary" onClick={() => setShowBarcodeDialog(true)}>
                Print Barcodes
              </Button>
            )}
          </div>

          {lastRegisteredPatient && (
            <BarcodePrintDialog
              open={showBarcodeDialog}
              onClose={() => setShowBarcodeDialog(false)}
              barcodeNumber={lastRegisteredPatient.barcodeNumber}
              patientName={lastRegisteredPatient.name}
            />
          )}

        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Details (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Section */}
          <Card className="border-none shadow-md">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800">Patient Details</CardTitle>
                  <p className="text-sm text-muted-foreground">Basic personal information required for registration</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Input
                  id="name"
                  label="Full Name *"
                  placeholder="e.g. John Doe"
                  className="h-11"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    id="age"
                    type="number"
                    label="Age *"
                    placeholder="e.g. 32"
                    className="h-11"
                    error={errors.age?.message}
                    {...register('age', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender *</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="gender" className="h-11">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    id="contactNumber"
                    label="Phone Number *"
                    placeholder="e.g. 9876543210"
                    className="h-11"
                    error={errors.contactNumber?.message}
                    {...register('contactNumber')}
                  />
                </div>

                <div>
                  <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    placeholder="e.g. john@example.com"
                    className="h-11"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  className="mt-2 resize-none"
                  rows={3}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="mt-1 text-sm font-medium text-destructive">{errors.address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment & Project Info */}
          <Card className="border-none shadow-md">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-blue-500 rounded-full" />
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-800">Employment & Project</CardTitle>
                  <p className="text-sm text-muted-foreground">Optional details for corporate or camp patients</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Project Selection (for Receptionists) */}
              {user?.role === UserRole.RECEPTIONIST && (
                <div className="space-y-2">
                  <Label htmlFor="projectId" className="text-sm font-medium text-gray-700">Project / Camp</Label>
                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'all'}
                        onValueChange={(value) => field.onChange(value === 'all' ? undefined : value)}
                        disabled={isLoadingProjects}
                      >
                        <SelectTrigger id="projectId" className="h-11 bg-blue-50/50 border-blue-100">
                          <SelectValue placeholder="Select a project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">None (Individual Patient)</SelectItem>
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
                  {selectedProject && (
                    <div className="mt-2 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm border border-blue-100">
                      <p className="font-medium flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {selectedProject.name}
                      </p>
                      {selectedProject.campSettings?.requireEmployeeId && (
                        <p className="mt-1 text-orange-700 font-medium ml-4">
                          • Employee ID is required
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    id="employeeId"
                    label={selectedProject?.campSettings?.requireEmployeeId ? "Employee ID *" : "Employee ID"}
                    placeholder="e.g. EMP001"
                    className="h-11"
                    error={errors.employeeId?.message}
                    {...register('employeeId')}
                  />
                </div>

                <div>
                  <Input
                    id="companyName"
                    label="Company Name"
                    placeholder="e.g. Tech Corp"
                    className="h-11"
                    error={errors.companyName?.message}
                    {...register('companyName')}
                    disabled={!!selectedProject?.companyName}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tests & Payment (1/3 width) */}
        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Test Selection Card */}
            <Card className="border-none shadow-md border-t-4 border-t-primary">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">Test Selection</CardTitle>
                <p className="text-sm text-muted-foreground">Choose a package or individual tests</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Package Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="packageId" className="text-sm font-medium text-gray-700">Select Package</Label>
                  <Controller
                    name="packageId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                        disabled={isLoadingPackages}
                      >
                        <SelectTrigger id="packageId" className="h-11">
                          <SelectValue placeholder="Select a package..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Package</SelectItem>
                          {packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - ₹{Number(pkg.price).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {selectedPackage && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-green-900">{selectedPackage.name}</span>
                      <span className="font-bold text-green-700">₹{Number(selectedPackage.price).toFixed(2)}</span>
                    </div>
                    <p className="text-green-700 text-xs">Includes {selectedPackage.tests?.length || 0} tests</p>
                  </div>
                )}

                <Separator />

                {/* Individual Tests */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    {selectedPackageId ? 'Add Extra Tests' : 'Select Tests *'}
                  </Label>

                  {isLoadingTests ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading tests...</div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {tests.map((test) => (
                        <div
                          key={test.id}
                          className={`flex items-start space-x-3 p-2 rounded-md transition-colors ${watch('addonTestIds')?.includes(test.id)
                            ? 'bg-primary-50 border border-primary-100'
                            : 'hover:bg-gray-50 border border-transparent'
                            }`}
                        >
                          <Controller
                            name="addonTestIds"
                            control={control}
                            render={({ field }) => {
                              const isChecked = field.value?.includes(test.id) || false;
                              return (
                                <Checkbox
                                  id={`test-${test.id}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    const currentIds = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentIds, test.id]);
                                    } else {
                                      field.onChange(currentIds.filter((id) => id !== test.id));
                                    }
                                  }}
                                  className="mt-1"
                                />
                              );
                            }}
                          />
                          <div className="flex-1 cursor-pointer" onClick={() => {
                            const currentIds = watch('addonTestIds') || [];
                            const isChecked = currentIds.includes(test.id);
                            if (!isChecked) {
                              setValue('addonTestIds', [...currentIds, test.id]);
                            } else {
                              setValue('addonTestIds', currentIds.filter(id => id !== test.id));
                            }
                          }}>
                            <Label htmlFor={`test-${test.id}`} className="font-medium cursor-pointer text-sm block">
                              {test.name}
                            </Label>
                            {test.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{test.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.addonTestIds && (
                    <p className="text-xs font-medium text-destructive">{errors.addonTestIds.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price Summary & Actions */}
            <Card className="border-none shadow-lg bg-gray-900 text-white">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300 text-sm">
                    <span>Package</span>
                    <span>₹{packagePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300 text-sm">
                    <span>Tests ({selectedAddonTests.length})</span>
                    <span>₹{testsTotal.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-3xl font-bold text-green-400">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold h-12 text-lg shadow-lg shadow-green-900/20"
                  isLoading={isSubmitting}
                >
                  Register Patient
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
};
