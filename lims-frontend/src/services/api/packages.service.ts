import apiClient from './api.client';
import {
  Package,
  CreatePackageRequest,
  UpdatePackageRequest,
  QueryPackagesParams,
  AddTestToPackageRequest,
  PackageTest,
} from '../../types/package.types';

export const packagesService = {
  async getPackages(query?: QueryPackagesParams): Promise<Package[]> {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) {
      params.append('is_active', query.isActive.toString());
    }

    const response = await apiClient.get<Package[]>(
      `/packages${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  async getPackageById(id: string): Promise<Package> {
    const response = await apiClient.get<Package>(`/packages/${id}`);
    return response.data;
  },

  async createPackage(data: CreatePackageRequest): Promise<Package> {
    const response = await apiClient.post<Package>('/packages', data);
    return response.data;
  },

  async updatePackage(id: string, data: UpdatePackageRequest): Promise<Package> {
    const response = await apiClient.put<Package>(`/packages/${id}`, data);
    return response.data;
  },

  async deletePackage(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/packages/${id}`);
    return response.data;
  },

  async addTestToPackage(
    packageId: string,
    data: AddTestToPackageRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/packages/${packageId}/tests`,
      data
    );
    return response.data;
  },

  async removeTestFromPackage(
    packageId: string,
    testId: string
  ): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/packages/${packageId}/tests/${testId}`
    );
    return response.data;
  },

  async getPackageTests(packageId: string): Promise<PackageTest[]> {
    const response = await apiClient.get<PackageTest[]>(`/packages/${packageId}/tests`);
    return response.data;
  },
};

