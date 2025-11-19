'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  createProjectSchema,
  updateProjectSchema,
  CreateProjectFormData,
  UpdateProjectFormData,
} from '@/utils/validation/project-schemas';
import { Project } from '@/types/project.types';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { projectsService } from '@/services/api/projects.service';
import { packagesService } from '@/services/api/packages.service';
import { Package } from '@/types/package.types';
import { useUIStore } from '@/store/ui.store';
import { getErrorMessage } from '@/utils/error-handler';
import { ApiError } from '@/types/api.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectFormProps {
  project?: Project;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  mode = 'create',
  onSuccess,
}) => {
  const router = useRouter();
  const { addToast } = useUIStore();
  const isEditMode = mode === 'edit' && !!project;
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  const schema = isEditMode ? updateProjectSchema : createProjectSchema;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData | UpdateProjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode
      ? {
          name: project.name,
          description: project.description,
          companyName: project.companyName || undefined,
          contactPerson: project.contactPerson || undefined,
          contactNumber: project.contactNumber || undefined,
          contactEmail: project.contactEmail || undefined,
          campDate: project.campDate || undefined,
          campLocation: project.campLocation || undefined,
          campSettings: project.campSettings || undefined,
          notes: project.notes || undefined,
        }
      : {
          campSettings: {
            autoGeneratePatientIds: false,
            requireEmployeeId: false,
          },
        },
  });

  const autoGenerateIds = watch('campSettings.autoGeneratePatientIds');
  const requireEmployeeId = watch('campSettings.requireEmployeeId');

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoadingPackages(true);
      try {
        const packagesData = await packagesService.getPackages({ isActive: true });
        setPackages(packagesData);
      } catch (err) {
        const apiError = err as ApiError;
        addToast({
          type: 'error',
          message: getErrorMessage(apiError) || 'Failed to load packages',
        });
      } finally {
        setIsLoadingPackages(false);
      }
    };

    fetchPackages();
  }, [addToast]);

  const onSubmit = async (data: CreateProjectFormData | UpdateProjectFormData) => {
    try {
      if (isEditMode) {
        await projectsService.updateProject(project!.id, data as UpdateProjectFormData);
        addToast({
          type: 'success',
          message: 'Project updated successfully',
        });
      } else {
        await projectsService.createProject(data as CreateProjectFormData);
        addToast({
          type: 'success',
          message: 'Project created successfully',
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/projects');
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        type: 'error',
        message: getErrorMessage(apiError),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              id="name"
              label="Project Name"
              placeholder="Enter project name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Input
              id="companyName"
              label="Company Name"
              placeholder="Enter company name"
              error={errors.companyName?.message}
              {...register('companyName')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              id="contactPerson"
              label="Contact Person"
              placeholder="Enter contact person name"
              error={errors.contactPerson?.message}
              {...register('contactPerson')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="contactNumber"
                label="Contact Number"
                placeholder="Enter contact number"
                error={errors.contactNumber?.message}
                {...register('contactNumber')}
              />
            </div>

            <div>
              <Input
                id="contactEmail"
                type="email"
                label="Contact Email"
                placeholder="Enter contact email"
                error={errors.contactEmail?.message}
                {...register('contactEmail')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camp Information */}
      <Card>
        <CardHeader>
          <CardTitle>Camp Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="campDate"
                type="date"
                label="Camp Date"
                error={errors.campDate?.message}
                {...register('campDate')}
              />
            </div>

            <div>
              <Input
                id="campLocation"
                label="Camp Location"
                placeholder="Enter camp location"
                error={errors.campLocation?.message}
                {...register('campLocation')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camp Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Camp Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="campSettings.autoGeneratePatientIds"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  id="autoGeneratePatientIds"
                  checked={value || false}
                  onCheckedChange={onChange}
                />
              )}
            />
            <Label htmlFor="autoGeneratePatientIds" className="font-normal cursor-pointer">
              Auto-generate patient IDs with prefix
            </Label>
          </div>

          {autoGenerateIds && (
            <div>
              <Input
                id="patientIdPrefix"
                label="Patient ID Prefix"
                placeholder="e.g., CAMP2025"
                maxLength={20}
                error={errors.campSettings?.patientIdPrefix?.message}
                {...register('campSettings.patientIdPrefix')}
              />
              <p className="mt-1 text-xs text-gray-500">
                Patient IDs will be generated as: PREFIX-YYYYMMDD-XXXX
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Controller
              name="campSettings.requireEmployeeId"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  id="requireEmployeeId"
                  checked={value || false}
                  onCheckedChange={onChange}
                />
              )}
            />
            <Label htmlFor="requireEmployeeId" className="font-normal cursor-pointer">
              Require employee ID for patients
            </Label>
          </div>

          <div>
            <Label htmlFor="defaultPackageId">Default Package (Optional)</Label>
            <Controller
              name="campSettings.defaultPackageId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || 'all'}
                  onValueChange={(value) => field.onChange(value === 'all' ? undefined : value)}
                  disabled={isLoadingPackages}
                >
                  <SelectTrigger id="defaultPackageId">
                    <SelectValue placeholder="Select default package (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">None</SelectItem>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} (₹{pkg.price.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              Default package to assign when registering patients for this project
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            placeholder="Enter any additional notes or special instructions..."
            rows={4}
            {...register('notes')}
          />
        </CardContent>
      </Card>

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
          {isEditMode ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

