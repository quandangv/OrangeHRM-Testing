import { Page } from "@playwright/test";
import BasePage from "../pages/BasePage";
import {
  CandidateCreationData,
  CandidateCreationResults,
} from "../models/Candidate";
import { VacancyCreationData, VacancyCreationResults } from "../models/Vacancy";

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

  public async setLocalization(language: string, dateFormat: string) {
    const response = await this.page.evaluate(
      async ({ baseURL, language, dateFormat }) => {
        const response = await fetch(
          baseURL + "/web/index.php/api/v2/admin/localization",
          {
            method: "PUT",
            body: `{"language":"${language}","dateFormat":"${dateFormat}"}`,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        return await response.json();
      },
      { baseURL: this.baseURL, language, dateFormat }
    );
    if (
      response.data.language != language ||
      response.data.dateFormat != dateFormat
    )
      throw Error("Set localization failed");
  }
  public async get(url: string) {
    return this.page.evaluate(async (url) => {
      const response = await fetch(url, { method: "GET" });
      return (await response.json()).data;
    }, this.baseURL + url);
  }

  public async apiCreateVacancy(
    data: VacancyCreationData
  ): Promise<VacancyCreationResults> {
    return this.page.evaluate(
      async ([baseURL, data]) => {
        const response = await fetch(
          baseURL + "/web/index.php/api/v2/recruitment/vacancies",
          {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        return (await response.json()).data;
      },
      [this.baseURL, data] as [string, VacancyCreationData]
    );
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

  public async apiCreateCandidate(data: CandidateCreationData) {
    return this.page.evaluate(
      async ([baseURL, data]) => {
        const response = await fetch(
          baseURL + "/web/index.php/api/v2/recruitment/candidates",
          {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        return await response.json();
      },
      [this.baseURL, data] as [string, CandidateCreationData]
    );
  }

  public static getName(item: {
    firstName: string;
    middleName: string;
    lastName: string;
  }) {
    return item.firstName + " " + item.middleName + " " + item.lastName;
  }
}
