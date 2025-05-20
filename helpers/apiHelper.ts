import { expect, Page } from "@playwright/test";
import BasePage from "../pages/basePage";
import {
  CandidateCreationData,
  CandidateCreationResults,
  CandidateStatus,
} from "../models/candidate";
import {
  VacancyCreationData,
  VacancyCreationResults,
  VacancyItem,
} from "../models/vacancy";
import {
  JobTitleCreationData,
  JobTitleCreationResults,
  JobTitleItem,
} from "../models/jobTitle";
import { EmployeeItem } from "../models/employee";

export type DataPromise<T> = Promise<{ data: T; meta: any[]; rels: any[] }>;

export default class APIHelper {
  private baseURL: string;
  private page: Page;
  constructor(page: Page | BasePage, baseURL: string) {
    if (page instanceof BasePage) this.page = page.page;
    else this.page = page;
    if (baseURL.endsWith("/"))
      baseURL = baseURL.substring(0, baseURL.length - 1);
    this.baseURL = baseURL;
  }

  public async configure(url: string, data: any) {
    const response = await this.page.evaluate(
      async ({ url, data }) => {
        const response = await fetch(url, {
          method: "PUT",
          body: JSON.stringify(data),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        return await response.json();
      },
      { url: this.baseURL + url, data }
    );
    expect(response).toMatchObject({ data, meta: [], rels: [] });
  }

  public async setLocalization(language: string, dateFormat: string) {
    return this.configure("/web/index.php/api/v2/admin/localization", {
      language,
      dateFormat,
    });
  }

  public async enableAllModules() {
    return this.configure("/web/index.php/api/v2/admin/modules", {
      admin: true,
      pim: true,
      leave: true,
      time: true,
      recruitment: true,
      performance: true,
      maintenance: true,
      mobile: true,
      directory: true,
      claim: true,
      buzz: true,
    });
  }

  public async get(url: string) {
    return this.page.evaluate(async (url) => {
      const response = await fetch(url, { method: "GET" });
      return (await response.json()).data;
    }, this.baseURL + url);
  }

  public async getJobTitles(): Promise<JobTitleItem[]> {
    return this.get("/web/index.php/api/v2/admin/job-titles");
  }

  public async getEmployees(): Promise<EmployeeItem[]> {
    return this.get(
      "/web/index.php/api/v2/pim/employees?includeEmployees=onlyCurrent"
    );
  }

  public async getHiringManagers(): Promise<EmployeeItem[]> {
    return this.get("/web/index.php/api/v2/recruitment/hiring-managers");
  }

  public async getVacancies(): Promise<VacancyItem[]> {
    return this.get("/web/index.php/api/v2/recruitment/vacancies");
  }

  public async getStatuses(): Promise<CandidateStatus[]> {
    return this.get("/web/index.php/api/v2/recruitment/candidates/statuses");
  }

  public async delete(url: string, ...ids: number[]) {
    await this.page.evaluate(
      async ([url, ids]) => {
        await fetch(url, {
          method: "DELETE",
          body: `{"ids":[${ids.join(",")}]}`,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
      },
      [this.baseURL + url, ids] as [string, number[]]
    );
  }

  public async create(path: string, data: unknown): Promise<any> {
    const response = await this.page.evaluate(
      async ([path, data]) => {
        const response = await fetch(path, {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
        if (response.status > 399) return { error: response.status };
        return await response.json();
      },
      [this.baseURL + path, data] as [string, unknown]
    );
    expect(response.error).toBeUndefined();
    return response;
  }

  public async createJobTitle(
    data: JobTitleCreationData
  ): DataPromise<JobTitleCreationResults> {
    return this.create("/web/index.php/api/v2/admin/job-titles", data);
  }

  public async createVacancy(
    data: VacancyCreationData
  ): DataPromise<VacancyCreationResults> {
    return this.create("/web/index.php/api/v2/recruitment/vacancies", data);
  }

  public async createCandidate(
    data: CandidateCreationData
  ): DataPromise<CandidateCreationResults> {
    return this.create("/web/index.php/api/v2/recruitment/candidates", data);
  }

  public static getName(item: {
    firstName: string;
    middleName: string;
    lastName: string;
  }) {
    return item.firstName + " " + item.middleName + " " + item.lastName;
  }
}
