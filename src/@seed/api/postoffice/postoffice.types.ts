export type EmailTemplate = {
  id: number;
  name: string;
  description: string;
  subject: string;
  content: string;
  html_content: string;
}

export type ListTemplatesResponse = {
  status: string;
  cycles: EmailTemplate[];
}
