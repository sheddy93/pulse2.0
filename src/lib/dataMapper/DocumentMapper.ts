/**
 * DocumentMapper
 * ──────────────
 * Maps Document entity for e-signature and compliance.
 */

export class DocumentMapper {
  toPersistence(domain: any) {
    return {
      id: domain.id,
      company_id: domain.company_id,
      employee_id: domain.employee_id,
      title: domain.title,
      doc_type: domain.doc_type,
      file_url: domain.file_url,
      signature_required: domain.signature_required,
      signature_status: domain.signature_status,
      expiry_date: domain.expiry_date,
      is_deleted: domain.is_deleted,
    };
  }

  toDomain(raw: any) {
    return {
      id: raw.id,
      company_id: raw.company_id,
      employee_id: raw.employee_id,
      title: raw.title,
      doc_type: raw.doc_type,
      file_url: raw.file_url,
      uploaded_by: raw.uploaded_by,
      signature_required: raw.signature_required,
      signature_status: raw.signature_status,
      signed_by: raw.signed_by,
      signed_at: raw.signed_at ? new Date(raw.signed_at) : null,
      expiry_date: raw.expiry_date ? new Date(raw.expiry_date) : null,
      created_date: new Date(raw.created_date),
      updated_date: new Date(raw.updated_date),
    };
  }

  toDTO(domain: any) {
    return {
      id: domain.id,
      title: domain.title,
      doc_type: domain.doc_type,
      signature_required: domain.signature_required,
      signature_status: domain.signature_status,
      expiry_date: domain.expiry_date,
    };
  }
}