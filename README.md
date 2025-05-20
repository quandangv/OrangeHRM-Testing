# OrangeHRM Automation Testing

Playwright is used as the automation framework to utilize its cross browser/platform support

## Project structure

The project follows the standard playwright project structure, with test scripts in the `tests` folder. Other supporting modules are organized into these folders:

- `pages` contains modules to command the application under test and retrieve information displayed in it.
- `helpers` contains modules that help with other common tasks such as randomizing the test cases and interacting with the API
- `models` contains interfaces that represents the data types of API request bodies and responses.

Since some features require setup before being tested, like the candidate search feature requires creating candidates, the API is used to quickly perform the setup. These setup steps are organized to fixtures to be shared by tests requiring similar setup:

- `apiHelper` logins and creates an APIHelper instance to interact with the API
- `vacancies` and `candidates` creates a number of corresponding objects for testing
- `loginPage`, `dashboardPage`, and `candidateSearch` navigates to the respective pages before the test. `candidateSearch` also creates candidates to test searching

## Running the test cases

To install dependencies, run `npm install` and `npx playwright install --with-deps`

Afterward, run `npx playwright test` to run all scripts in the `tests` folder. To run a specific script, execute `npx playwright test <script.spec.ts>`. Other configurations can be set in `playwright.config.ts`

After the tests are complete, the `playwright-report` folder contains the report files and video recordings. The HTML report can be viewed by running `npx playwright show-report`
