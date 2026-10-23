import { SubcompanyModel } from '../model/subcompany.model';
import { CreateSubcompanyDto, UpdateSubcompanyDto, SubcompanyRecord } from '../types/subcompany.types';

export class SubcompanyService {
  public static async createSubcompany(dto: CreateSubcompanyDto): Promise<SubcompanyRecord> {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Subcompany name is required.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new Error('Subcompany email is required.');
    }
    if (!dto.parent_company_id) {
      throw new Error('Parent company ID is required.');
    }
    return await SubcompanyModel.createSubcompany(dto);
  }

  public static async getSubcompaniesByParent(parentCompanyId: string): Promise<SubcompanyRecord[]> {
    return await SubcompanyModel.getSubcompaniesByParent(parentCompanyId);
  }

  public static async getSubcompanyById(id: string): Promise<SubcompanyRecord | null> {
    return await SubcompanyModel.getSubcompanyById(id);
  }

  public static async updateSubcompany(id: string, dto: UpdateSubcompanyDto): Promise<SubcompanyRecord | null> {
    return await SubcompanyModel.updateSubcompany(id, dto);
  }

  public static async updateStatus(id: string, status: 'Active' | 'Inactive'): Promise<boolean> {
    return await SubcompanyModel.updateStatus(id, status);
  }

  public static async deleteSubcompany(id: string): Promise<boolean> {
    return await SubcompanyModel.deleteSubcompany(id);
  }
}
