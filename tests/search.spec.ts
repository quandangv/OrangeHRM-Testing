import { expect } from "@playwright/test";
import { test } from "../helpers/fixtures";
import Randomizer from "../helpers/randomizer";
import CandidateSearchPage, {
  CandidateFilter,
} from "../pages/candidateSearchPage";
import APIHelper from "../helpers/apiHelper";

// Test searching for candidates using filters
test.describe("candidate search", () => {
  test("job title", async ({ candidateSearch, apiHelper }) => {
    const jobTitles = await apiHelper.getJobTitles();
    await testNoResult(
      candidateSearch,
      () => ({ jobTitle: Randomizer.choose(jobTitles).title }),
      2
    );
    await testSearching(
      candidateSearch,
      () => ({
        jobTitle: Randomizer.choose(candidateSearch.items)["Job Title"],
      }),
      4
    );
  });

  test("vacancy", async ({ candidateSearch, vacancies }) => {
    await testNoResult(
      candidateSearch,
      () => ({ vacancy: Randomizer.choose(vacancies).name }),
      2
    );
    await testSearching(
      candidateSearch,
      () => ({ vacancy: Randomizer.choose(candidateSearch.items)["Vacancy"] }),
      4
    );
  });

  // This test fails due to the bug: The middle names of hiring managers are not shown in the filter options
  test("hiring manager", async ({ candidateSearch, apiHelper }) => {
    const hiringManagers = await apiHelper.getHiringManagers();
    await testSearching(
      candidateSearch,
      () => ({
        hiringManager: APIHelper.getName(Randomizer.choose(hiringManagers)),
      }),
      2
    );
    await testSearching(
      candidateSearch,
      () => ({
        hiringManager: Randomizer.choose(candidateSearch.items)[
          "Hiring Manager"
        ],
      }),
      4
    );
  });

  test("status", async ({ candidateSearch, apiHelper }) => {
    const statuses = await apiHelper.getStatuses();
    await testNoResult(
      candidateSearch,
      () => ({
        status: Randomizer.choose(statuses).label,
      }),
      2
    );
    await testSearching(
      candidateSearch,
      () => ({
        status: Randomizer.choose(candidateSearch.items)["Status"],
      }),
      4
    );
  });

  // This test fails due to the bug: Candidates can be searched by their first, middle or last name, but not their full name
  test("full name", async ({ candidateSearch }) => {
    await testSearching(
      candidateSearch,
      () => ({
        candidateName: Randomizer.choose(candidateSearch.items)["Candidate"],
      }),
      4
    );
  });

  test("first/middle/last name", async ({ candidateSearch }) => {
    await testSearching(
      candidateSearch,
      () => ({
        candidateName: Randomizer.choose(candidateSearch.items).name.first,
      }),
      2
    );
    await testSearching(
      candidateSearch,
      () => ({
        candidateName: Randomizer.choose(candidateSearch.items).name.middle,
      }),
      2
    );
    await testSearching(
      candidateSearch,
      () => ({
        candidateName: Randomizer.choose(candidateSearch.items).name.last,
      }),
      2
    );
  });

  // This test fails due to the bug: can not search candidates by keywords if the keywords are not in the exact order, "javascript,css" doesn't match "css,javascript"
  test("keyword", async ({ candidateSearch }) => {
    // Search a non-matching keyword
    await testNoResult(
      candidateSearch,
      () => ({ keywords: [Randomizer.str(8)] }),
      2
    );
    // Search by 1 keyword
    await testSearching(
      candidateSearch,
      () => ({
        keywords: [
          Randomizer.choose(Randomizer.choose(candidateSearch.items).Keywords),
        ],
      }),
      2
    );
    // Search by 2 keywords
    await testSearching(
      candidateSearch,
      () => ({
        keywords: Randomizer.shuffle(
          Randomizer.choose(candidateSearch.items).Keywords.slice(0, 2)
        ),
      }),
      2
    );
  });

  // Bug: "to" date of the date of application range is exclusive, {from: 2025-05-10, to: 2025-05-11} does not match the date 2025-05-11
  test("date of application", async ({ candidateSearch }) => {
    await testSearching(
      candidateSearch,
      () => {
        let date1 = Randomizer.pastDate(),
          date2 = Randomizer.pastDate();
        while (date1.getTime() == date2.getTime())
          date2 = Randomizer.pastDate();
        if (date1 > date2) [date1, date2] = [date2, date1];
        return {
          dateOfApplication: {
            from: date1.toISOString().substring(0, 10),
            to: date2.toISOString().substring(0, 10),
          },
        };
      },
      10
    );
  });

  test("method of application", async ({ candidateSearch }) => {
    await testSearching(
      candidateSearch,
      () => ({ methodOfApplication: "Manual" }),
      1
    );
    await testSearching(
      candidateSearch,
      () => ({ methodOfApplication: "Online" }),
      1
    );
  });
});

// Verify that all options in the filter dropdowns are valid
test.describe("filter options", () => {
  test("job title", async ({ candidateSearch, apiHelper }) => {
    const items = await apiHelper.getJobTitles();
    const options = await candidateSearch.getAllOptions("Job Title");
    const names = items.map((item) => item.title);
    for (const option of options) expect(names).toContain(option);
    for (const item of candidateSearch.items)
      expect(options).toContain(item["Job Title"]);
  });
  test("vacancy", async ({ candidateSearch, apiHelper }) => {
    const items = await apiHelper.getVacancies();
    const options = await candidateSearch.getAllOptions("Vacancy");
    const names = items.map((item) => item.name);
    for (const option of options) expect(names).toContain(option);
    for (const item of candidateSearch.items)
      expect(options).toContain(item["Vacancy"]);
  });
  test("hiring manager", async ({ candidateSearch, apiHelper }) => {
    const items = await apiHelper.getHiringManagers();
    const options = await candidateSearch.getAllOptions("Hiring Manager");
    const names = items.map((item) => APIHelper.getName(item));
    for (const option of options) expect(names).toContain(option);
    for (const item of candidateSearch.items)
      expect(options).toContain(item["Hiring Manager"]);
  });
  test("status", async ({ candidateSearch, apiHelper }) => {
    const items = await apiHelper.getStatuses();
    const options = await candidateSearch.getAllOptions("Status");
    const names = items.map((item) => item.label);
    for (const option of options) expect(names).toContain(option);
    for (const item of candidateSearch.items)
      expect(options).toContain(item["Status"]);
  });
});

/**
 * Test a filter where no result is returned
 * @param candidateSearch The page object to control the UI
 * @param getFilter A lambda that will be called to get a new filter. This fitler will be created repeatedly until it has no result
 * @param count The number of times to repeat the test
 */
async function testNoResult(
  candidateSearch: CandidateSearchPage,
  getFilter: () => CandidateFilter,
  count: number
) {
  for (let i = 0; i < count; i++) {
    let filter = getFilter();
    while (candidateSearch.filterLocally(filter).length > 0)
      filter = getFilter();
    await expect(candidateSearch.makeSearch(filter)).resolves.not.toThrow();
    const searchResults = await candidateSearch.getSearchResults();
    expect(candidateSearch.clearOtherItems(searchResults), {
      message: "search condition: " + JSON.stringify(filter),
    }).toHaveLength(0);
  }
}

/**
 * Repeatedly test a candidate filter scheme a number of times
 * @param candidateSearch The page object to control the UI
 * @param getFilter A lambda that will be called to get a new filter
 * @param count The number of repeats
 */
async function testSearching(
  candidateSearch: CandidateSearchPage,
  getFilter: () => CandidateFilter,
  count: number
) {
  for (let i = 0; i < count; i++) {
    const filter = getFilter();
    await expect(candidateSearch.makeSearch(filter)).resolves.not.toThrow();
    const searchResults = await candidateSearch.getSearchResults();
    expect(
      candidateSearch.makeTable(candidateSearch.clearOtherItems(searchResults)),
      { message: "search condition: " + JSON.stringify(filter) }
    ).toBe(candidateSearch.makeTable(candidateSearch.filterLocally(filter)));
  }
}
