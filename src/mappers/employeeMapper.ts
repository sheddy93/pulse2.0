/**
 * src/mappers/employeeMapper.ts
 * =============================
 * Trasformazione dati Employee tra formati
 * 
 * Usato da services e API layer
 * La UI NON deve sapere come sono i dati raw da Base44
 */

export const employeeMapper = {
  /**
   * toViewModel(raw)
   * Da formato database a formato UI
   */
  toViewModel(raw: any) {
    if (!raw) return null;

    return {
      id: raw.id,
      fullName: raw.full_name,
      email: raw.email,
      phone: raw.phone,
      department: raw.department_id,
      position: raw.position,
      employmentType: raw.employment_type,
      status: raw.status,
      startDate: raw.start_date,
      endDate: raw.end_date,
      avatar: raw.avatar_url,
      companyId: raw.company_id,
      createdAt: raw.created_date,
      updatedAt: raw.updated_date,
    };
  },

  /**
   * toApiPayload(formData)
   * Da form UI a formato API Base44
   * In futuro: da form UI a formato NestJS
   */
  toApiPayload(formData: any) {
    return {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      department_id: formData.department,
      position: formData.position,
      employment_type: formData.employmentType,
      status: formData.status || 'active',
      start_date: formData.startDate,
      end_date: formData.endDate,
      avatar_url: formData.avatar,
      company_id: formData.companyId,
    };
  },

  /**
   * toListViewModel(rawArray)
   * Mappa array
   */
  toListViewModel(rawArray: any[]) {
    return rawArray.map(emp => this.toViewModel(emp));
  },

  /**
   * fromFormData(formData)
   * Da form direttamente a view model
   */
  fromFormData(formData: any) {
    return {
      id: null,
      fullName: formData.fullName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      department: formData.department || '',
      position: formData.position || '',
      employmentType: formData.employmentType || 'full_time',
      status: formData.status || 'active',
      startDate: formData.startDate || '',
      endDate: formData.endDate || null,
      avatar: formData.avatar || null,
      companyId: formData.companyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};