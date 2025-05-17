/** Data model of employees returned in lists of employees */
export interface EmployeeItem {
  empNumber: number;
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
  terminationId?: number;
}
