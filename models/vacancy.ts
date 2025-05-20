/** The model for the vacancy items in the list returned by the vacancies query */
export interface VacancyItem {
  id: number;
  name: string;
  status: boolean;
  isPublished: boolean;
}

/** The model for the vacancy object to add a new vacancy */
export interface VacancyCreationData {
  name: string;
  description: string;
  employeeId: number;
  jobTitleId: number;
  isPublished: boolean;
  numOfPositions?: number;
  status: boolean;
}

/** The model for the vacancy object returned after creating one */
export interface VacancyCreationResults {
  id: number;
  name: string;
  description: string;
  hiringManager: HiringManager;
  jobTitle: JobTitle;
  isPublished: boolean;
  numOfPositions?: number;
  status: boolean;
}
export type VacancyDetails = VacancyCreationResults;

/** The model for the hiring manager object returned when creating a vacancy. This matches the data from Employee, but the field names are different */
export interface HiringManager {
  // This is the same as the Employee's empNumber
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  terminationId?: number;
}

/** The model for the job title object returned when creating a vacancy. This matches the data from JobTitle, but there is an extra field */
export interface JobTitle {
  id: number;
  title: string;
  // This field doesn't exist in the JobTitle data
  isDeleted: boolean;
}
