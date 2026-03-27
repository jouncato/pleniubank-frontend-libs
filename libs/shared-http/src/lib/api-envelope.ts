export interface ApiMeta {
  correlation_id?: string;
  /** Paginación offset clásica (si aplica). */
  pagination?: {
    page: number;
    page_size: number;
    total: number;
  };
  /** Paginación cursor (Core `ResponseMeta`). */
  cursor?: string | null;
  total?: number | null;
  has_more?: boolean;
}

export interface ApiErrorItem {
  code: string;
  message: string;
  field?: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiMeta;
  errors?: ApiErrorItem[];
}

export interface ApiFailure {
  status: number;
  correlationId?: string;
  errors: ApiErrorItem[];
}
