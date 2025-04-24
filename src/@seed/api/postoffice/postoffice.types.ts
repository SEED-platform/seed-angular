export type EmailTemplate = {
  id: number;
  name: string;
  description: string;
  subject: string;
  content: string;
  html_content: string;
  created: string;
  last_updated: string;
  default_template_id?: number;
  language: string;
}

export type CreateEmailTemplateResponse = {
  status: string;
  data: EmailTemplate;
}

export type ListEmailTemplatesResponse = {
  status: string;
  data: EmailTemplate[];
}
