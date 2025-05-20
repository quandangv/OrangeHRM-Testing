import RestrictedPage from "./restrictedPage";

export default class DashboardPage extends RestrictedPage {
  public get identifier() {
    return this.page.getByRole("heading", { name: "Dashboard", exact: true });
  }

  public async goto(user = "Admin") {
    await this.loginAndGoto("/web/index.php/dashboard/index", user);
  }
}
