export interface PrintMessage {
  "operation-attributes-tag": {
    "requesting-user-name": string;
    "job-name": string;
    "document-format": string;
    "printer-uri": string;
  };
  "job-attributes-tag": {
    "copies": number;
    "orientation-requested": number;
    "print-quality": number
  };
  data: Buffer;
}

export interface PrintResponse {
  'job-id'?: number;
  version?: string;
  statusCode?: string;
  id?: number;
  'operation-attributes-tag'?: {
    'attributes-charset'?: string;
    'attributes-natural-language'?: string;
  };
  'job-attributes-tag'?: {
    'job-uri'?: string;
    'job-id'?: number;
    'job-state'?: number;
    'job-state-message'?: string;
    'job-state-reasons'?: string;
  };
}
