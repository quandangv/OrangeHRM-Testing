export interface JobTitleCreationData {
  title: string;
  description: string;
  note: string;
  jobSpecification?: JobSpecification;
}
/** Data model for the JobTitle items returned for the job-titles query */
export interface JobTitleItem {
  id: number;
  title: string;
  description: string;
  note: string;
  jobSpecification: JobSpecification;
}

export interface JobSpecification {
  id?: number;
  filename?: string;
  fileType?: string;
  fileSize?: number;
}

export type JobTitleDetails = JobTitleItem;
export type JobTitleCreationResults = JobTitleItem;
