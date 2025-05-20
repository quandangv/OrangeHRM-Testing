import APIHelper from "../helpers/APIHelper";
import { CandidateCreationData, CandidateDetails } from "../models/Candidate";
import RestrictedPage from "./RestrictedPage";

/** The candidate data model whose fields match the corresponding names of columns in the search results */
export class CandidateTags {
  "Job Title": string;
  "Vacancy": string;
  "Hiring Manager": string;
  "Status": string;
  "Candidate": string;
  "Keywords": string[];
  "Date of Application": string;
  "Method of Application": string;
  searchResultRow: string;
  name: { first: string; middle: string; last: string };

  constructor(details: CandidateDetails) {
    // Swap the date and month to match to match the format on the website
    this["Date of Application"] = details.dateOfApplication;
    this["Job Title"] = details.vacancy.jobTitle.title;
    this["Vacancy"] = details.vacancy.name;
    this["Hiring Manager"] = APIHelper.getName(details.vacancy.hiringManager);
    this["Status"] = details.status.label;
    this["Candidate"] = APIHelper.getName(details);
    this["Keywords"] = details.keywords.split(",").map((item) => item.trim());
    this["Method of Application"] = details.methodOfApplication.label;
    this.name = {
      first: details.firstName,
      middle: details.middleName,
      last: details.lastName,
    };
  }
}

/** Data model for the candidate filter */
export interface CandidateFilter {
  jobTitle?: string;
  vacancy?: string;
  hiringManager?: string;
  status?: string;
  candidateName?: string;
  keywords?: string[];
  dateOfApplication?: { from: string; to: string };
  methodOfApplication?: string;
}

export default class CandidateSearchPage extends RestrictedPage {
  /** The candidates created for testing */
  public items: CandidateTags[] = [];
  private headings: string[] = [];

  public get identifier() {
    return this.page.getByRole("heading", { name: "Candidates", exact: true });
  }

  public async goto(user = "Admin") {
    await this.loginAndGoto("/web/index.php/recruitment/viewCandidates", user);
    await this.waitForRecords();
  }

  public setItems(candidates: CandidateDetails[]) {
    this.items = candidates.map((item) => new CandidateTags(item));
  }

  public async waitForRecords() {
    await this.page
      .getByText(/Record(?:s)? Found$/)
      .first()
      .waitFor();
    await this.page.waitForTimeout(500);
  }

  /** Perform actions on the UI to search candidates and read the search results to an array of partial CandidateTags */
  public async makeSearch(filters: CandidateFilter) {
    if (filters.jobTitle != null)
      await this.selectDropdown("Job Title", filters.jobTitle);
    if (filters.vacancy != null)
      await this.selectDropdown("Vacancy", filters.vacancy);
    if (filters.hiringManager != null)
      await this.selectDropdown("Hiring Manager", filters.hiringManager);
    if (filters.status != null)
      await this.selectDropdown("Status", filters.status);
    if (filters.candidateName != null) {
      await this.getLabelledElement("Candidate Name", "//input").fill(
        filters.candidateName
      );
      await this.page
        .getByRole("option", { name: filters.candidateName, exact: false })
        .click({ timeout: 10000 });
    }
    if (filters.keywords != null)
      await this.getLabelledElement("Keywords", "//input").fill(
        filters.keywords.join(",")
      );
    if (filters.dateOfApplication != null) {
      await this.getLabelledElement("Date of Application", "//input").fill(
        filters.dateOfApplication.from
      );
      await this.page
        .getByPlaceholder("To", { exact: true })
        .fill(filters.dateOfApplication.to);
    }
    if (filters.methodOfApplication != null)
      await this.selectDropdown(
        "Method of Application",
        filters.methodOfApplication
      );
    this.page.getByRole("button", { name: "Search", exact: true }).click();
  }
  public async getSearchResults() {
    await this.page.waitForTimeout(500);
    await this.waitForRecords();
    const rowgroups = this.page.getByRole("rowgroup");
    this.headings = await Promise.all(
      (
        await rowgroups.first().getByRole("columnheader").all()
      ).map((item) => item.innerText())
    );
    const rows = rowgroups.last().getByRole("row");
    return await Promise.all(
      (
        await rows.all()
      ).map(async (row) => {
        const cells = await row.getByRole("cell").all();
        const result: Partial<CandidateTags> = {};
        for (let i = 0; i < cells.length; i++) {
          const heading = this.headings[i];
          if (heading != null) {
            result[heading] = await cells[i].textContent();
          }
        }
        return result;
      })
    );
  }

  /** Filter the created candidates locally to get the expected search results */
  public filterLocally(filter: CandidateFilter): CandidateTags[] {
    return this.items.filter((item) => {
      if (filter.jobTitle != null && item["Job Title"] != filter.jobTitle)
        return false;
      if (filter.vacancy != null && item["Vacancy"] != filter.vacancy)
        return false;
      if (
        filter.hiringManager != null &&
        item["Hiring Manger"] != filter.hiringManager
      )
        return false;
      if (filter.status != null && item["Status"] != filter.status)
        return false;
      if (
        filter.candidateName != null &&
        !item["Candidate"].includes(filter.candidateName)
      )
        return false;
      if (
        filter.keywords != null &&
        !filter.keywords.every((keyword) => item["Keywords"].includes(keyword))
      )
        return false;
      const date = new Date(item["Date of Application"]);
      if (
        filter.dateOfApplication != null &&
        (new Date(filter.dateOfApplication.from) > date ||
          new Date(filter.dateOfApplication.to) < date)
      )
        return false;
      if (
        filter.methodOfApplication != null &&
        item["Method of Application"] != filter.methodOfApplication
      )
        return false;
      return true;
    });
  }

  /** Returns a string table with only the data displayed in the search result */
  public makeTable(data: any[]) {
    return data
      .map((row) => this.headings.map((name) => row[name]).join(", "))
      .sort()
      .join("\n");
  }

  /** Clear the search results of the items not created in the test */
  public clearOtherItems<T>(searchResults: Record<string, T>[]) {
    return searchResults.filter((result) =>
      this.items.find((item) => item.Candidate == result.Candidate)
    );
  }
}
