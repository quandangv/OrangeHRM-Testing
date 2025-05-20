import { VacancyDetails } from "./vacancy";

/** The data model for candidates that matches the format of the create candidate request */
export interface CandidateCreationData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  vacancyId: number;
  keywords: string;
  comment: string;
  consentToKeepData: boolean;
  dateOfApplication: string;
}
/** The model for the object returned by the candidate creation */
export interface CandidateCreationResults {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
}

export interface CandidateStatus {
  id: number;
  label: string;
}

/** The detailed candidate data used to test candidate search */
export interface CandidateDetails {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  vacancy: VacancyDetails;
  keywords: string;
  comment: string;
  consentToKeepData: boolean;
  dateOfApplication: string;
  status: CandidateStatus;
  methodOfApplication: { id: number; label: string };
}
