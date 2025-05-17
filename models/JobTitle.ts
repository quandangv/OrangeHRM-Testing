/** Data model for the JobTitle items returned for the job-titles query */
export interface JobTitleItem {
  id: number;
  title: string;
  description: string;
  note: string;
  jobSpecification: {
    id?: number;
    filename?: string;
    fileType?: string;
    fileSize?: number;
  };
}
