import { Locator, Page } from "@playwright/test";
import BasePage from "./basePage";
import LoginPage from "./loginPage";
import { CandidateCreationData } from "../models/candidate";

export default abstract class RestrictedPage extends BasePage {
  public get profileImage() {
    return this.page.getByRole("img", { name: "profile picture", exact: true });
  }
  public get logoutLink() {
    return this.page.getByRole("menuitem", { name: "Logout", exact: true });
  }

  public async logout() {
    await this.profileImage.click();
    await this.logoutLink.click();
  }

  /**
   * Go to the specified URL, logging in if necessary
   * @param user The username to use for login
   */
  protected async loginAndGoto(URL: string, user: string) {
    await this.page.goto(URL);
    while (this.page.url().endsWith("/web/index.php/auth/login")) {
      const loginPage = new LoginPage(this);
      await loginPage.login(user);
      await this.page.goto(URL);
    }
  }
}
