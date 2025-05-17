import { test as base, expect as baseExpect, expect } from "@playwright/test";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import CandidateSearchPage from "./CandidateSearchPage";
import APIHelper from "../helpers/APIHelper";
import Randomizer from "../helpers/Randomizer";
import { VacancyDetails } from "../models/Vacancy";
import { CandidateDetails, CandidateStatus } from "../models/Candidate";
import config from "../playwright.config";
import { JobTitleItem } from "../models/JobTitle";
import { EmployeeItem } from "../models/Employee";

export const test = base.extend<
  {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    /** Go to the candidate search page, create some candidates for testing and add them to search page object. Deletes the created entities afterward */
    candidateSearch: CandidateSearchPage;
  },
  {
    apiHelper: APIHelper;
    jobTitles: JobTitleItem[];
    employees: EmployeeItem[];
    hiringManagers: EmployeeItem[];
    statuses: CandidateStatus[];
    /** Creates some vacancies and returns an array of them. Deletes the created vacancies afterward */
    vacancies: VacancyDetails[];
    /** Creates some vacancies, candidates and returns an array of the candidates. Deletes the created entities afterward */
    candidates: CandidateDetails[];
  }
>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.apiLogout();
    await loginPage.goto();
    await use(loginPage);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await use(dashboardPage);
  },
  apiHelper: [
    async ({ browser }, use) => {
      const page = await browser.newPage();
      const dashboard = new DashboardPage(page);
      await dashboard.goto("Admin");
      const apiHelper = new APIHelper(page, config.use!.baseURL!);
      await apiHelper.setLocalization("en_US", "Y-m-d");
      await use(apiHelper);
      await browser.close();
    },
    { scope: "worker" },
  ],
  jobTitles: [
    async ({ apiHelper }, use) => {
      await use(
        await apiHelper.get("/web/index.php/api/v2/admin/job-titles?limit=0")
      );
    },
    { scope: "worker" },
  ],
  employees: [
    async ({ apiHelper }, use) => {
      await use(
        await apiHelper.get(
          "/web/index.php/api/v2/pim/employees?includeEmployees=onlyCurrent"
        )
      );
    },
    { scope: "worker" },
  ],
  hiringManagers: [
    async ({ apiHelper }, use) => {
      await use(
        await apiHelper.get(
          "/web/index.php/api/v2/recruitment/hiring-managers?limit=0"
        )
      );
    },
    { scope: "worker" },
  ],
  statuses: [
    async ({ apiHelper }, use) => {
      await use(
        await apiHelper.get(
          "/web/index.php/api/v2/recruitment/candidates/statuses"
        )
      );
    },
    { scope: "worker" },
  ],
  vacancies: [
    async ({ apiHelper, jobTitles, employees }, use) => {
      const result: VacancyDetails[] = [];
      // Select only a few employees to simulate hiring managers working on multiple vacancies
      expect(employees.length).toBeGreaterThan(1);
      const hiringManagerCount = 2;
      const hiringManagers = [...employees];
      Randomizer.shuffle(hiringManagers, hiringManagerCount);
      hiringManagers.length = hiringManagerCount;
      const vacancyCount = 4;
      console.log("Created Vacancies:");
      for (let i = 0; i < vacancyCount; i++) {
        const chosenTitle = Randomizer.choose(jobTitles);
        const vacancy = {
          description: "description" + Randomizer.str(8),
          employeeId: Randomizer.choose(hiringManagers).empNumber,
          isPublished: true,
          jobTitleId: chosenTitle.id,
          name: chosenTitle.title + " vacancy" + Randomizer.str(5),
          numOfPositions: 1,
          status: true,
        };
        console.log(JSON.stringify(vacancy));
        result.push(await apiHelper.apiCreateVacancy(vacancy));
      }
      await use(result);
      await apiHelper.delete(
        "/web/index.php/api/v2/recruitment/vacancies",
        ...result.map((item) => item.id)
      );
    },
    { scope: "worker" },
  ],
  candidates: [
    async ({ vacancies, apiHelper }, use) => {
      const result: CandidateDetails[] = [];
      const candidateCount = 10;
      const keywordSeeds = Randomizer.uniqueStrings(6, 6);
      const nameSeeds = Randomizer.uniqueStrings(6, candidateCount);
      console.log("Created Candidates:");
      for (let i = 0; i < candidateCount; i++) {
        const vacancy = Randomizer.choose(vacancies);
        const candidate = {
          firstName: "firstName" + nameSeeds[i],
          middleName: "middleName" + Randomizer.str(3),
          lastName: "lastName" + Randomizer.str(3),
          email: `email${Randomizer.str(8)}@gmail.com`,
          contactNumber:
            "098" + String(Randomizer.int(1000000)).padStart(6, "0"),
          comment: "comment" + Randomizer.str(8),
          keywords:
            `keywords${Randomizer.choose(keywordSeeds)}` +
            `,keywords${Randomizer.choose(keywordSeeds)}`,
          dateOfApplication: Randomizer.pastDate()
            .toISOString()
            .substring(0, 10),
          vacancyId: vacancy.id,
          consentToKeepData: false,
        };
        console.log(JSON.stringify(candidate));
        const response = await apiHelper.apiCreateCandidate(candidate);
        expect(response.data).not.toBeNull();
        result.push({
          ...candidate,
          id: response.data.id,
          vacancy,
          // The following fields always have these values when the candidated is first created
          status: { id: 1, label: "Application Initiated" },
          methodOfApplication: { id: 1, label: "Manual" },
        });
      }
      await use(result);
      await apiHelper.delete(
        "/web/index.php/api/v2/recruitment/candidates",
        ...result.map((item) => item.id)
      );
    },
    { scope: "worker" },
  ],
  candidateSearch: async ({ page, candidates }, use) => {
    const searchPage = new CandidateSearchPage(page);
    await searchPage.goto();
    searchPage.setItems(candidates);
    await use(searchPage);
  },
});
