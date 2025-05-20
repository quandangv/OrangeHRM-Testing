import { test as base, expect } from "@playwright/test";
import LoginPage from "../pages/loginPage";
import DashboardPage from "../pages/dashboardPage";
import CandidateSearchPage from "../pages/candidateSearchPage";
import APIHelper from "./apiHelper";
import Randomizer from "./randomizer";
import { VacancyDetails } from "../models/vacancy";
import { CandidateDetails, CandidateStatus } from "../models/candidate";
import config from "../playwright.config";

export const test = base.extend<
  {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    /** Go to the candidate search page, create some candidates for testing and add them to search page object. Deletes the created entities afterward */
    candidateSearch: CandidateSearchPage;
  },
  {
    apiHelper: APIHelper;
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
  vacancies: [
    async ({ apiHelper }, use) => {
      const result: VacancyDetails[] = [];
      const employees = await apiHelper.getEmployees();
      // Select only a few employees to simulate hiring managers working on multiple vacancies
      let hiringManagers = [...employees];
      Randomizer.shuffle(hiringManagers, 2);
      hiringManagers = hiringManagers.slice(0, 2);
      const vacancyCount = 5;
      const jobTitles = await apiHelper.getJobTitles();
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
        const response = await apiHelper.createVacancy(vacancy);
        expect(response.data).not.toBeNull();
        console.log(JSON.stringify(response.data));
        result.push(response.data);
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
      const vacancyPool = vacancies.slice(1);
      for (let i = 0; i < candidateCount; i++) {
        const vacancy = Randomizer.choose(vacancyPool);
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
        const response = await apiHelper.createCandidate(candidate);
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
  candidateSearch: async ({ page, candidates, apiHelper }, use) => {
    const searchPage = new CandidateSearchPage(page);
    // Create a job title without candidates for testing
    const jobTitle = await apiHelper.createJobTitle({
      title: Randomizer.str(8),
      description: "description",
      note: "",
    });
    console.log("Created job title: " + JSON.stringify(jobTitle.data));
    await searchPage.goto();
    searchPage.setItems(candidates);
    await use(searchPage);
    await apiHelper.delete(
      "/web/index.php/api/v2/admin/job-titles",
      jobTitle.data.id
    );
  },
});
