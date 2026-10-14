import { CompanyModel } from '../model/company.model';
import { CompanyRecord, CreateCompanyDto, UpdateCompanyDto } from '../types/company.types';

export class CompanyService {
  public static async createCompany(dto: CreateCompanyDto): Promise<CompanyRecord> {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Company Legal Name is required.');
    }
    if (!dto.country || !dto.country.trim()) {
      throw new Error('Country is required.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new Error('Company Admin Email is required.');
    }

    return await CompanyModel.createCompany(dto);
  }

  public static async getAllCompanies(options: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ total: number; page: number; limit: number; companies: CompanyRecord[] }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 50));
    const offset = (page - 1) * limit;

    const { total, companies } = await CompanyModel.getAllCompanies({
      search: options.search,
      status: options.status,
      limit,
      offset
    });

    return { total, page, limit, companies };
  }

  public static async getCompanyById(id: string): Promise<CompanyRecord | null> {
    if (!id) throw new Error('Company ID is required.');
    return await CompanyModel.getCompanyById(id);
  }

  public static async updateCompany(id: string, dto: UpdateCompanyDto): Promise<CompanyRecord | null> {
    if (!id) throw new Error('Company ID is required.');
    return await CompanyModel.updateCompany(id, dto);
  }

  public static async updateUserAllocation(
    id: string,
    users: number,
    countryUserCounts: Record<string, string>
  ): Promise<CompanyRecord | null> {
    if (!id) throw new Error('Company ID is required.');
    if (typeof users !== 'number' || users < 1) {
      throw new Error('Total users must be at least 1.');
    }
    return await CompanyModel.updateUserAllocation(id, users, countryUserCounts);
  }

  public static async updateStatus(id: string, status: 'Active' | 'Inactive'): Promise<boolean> {
    if (!id) throw new Error('Company ID is required.');
    if (status !== 'Active' && status !== 'Inactive') {
      throw new Error("Status must be either 'Active' or 'Inactive'.");
    }
    return await CompanyModel.updateStatus(id, status);
  }

  public static async deleteCompany(id: string): Promise<boolean> {
    if (!id) throw new Error('Company ID is required.');
    return await CompanyModel.deleteCompany(id);
  }
}
