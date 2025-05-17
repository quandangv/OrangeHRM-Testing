import BasePage from "./BasePage";

export default class LoginPage extends BasePage {
  public static credentials: Record<string, string> = {
    Admin: "admin123",
  };
  public get inputUsername() {
    return this.page.getByRole("textbox", { name: "username" });
  }
  public get inputPassword() {
    return this.page.getByRole("textbox", { name: "password" });
  }
  public override get identifier() {
    return this.loginButton;
  }
  private get headingDashboard() {
    return this.page.getByRole("heading", { name: "Dashboard", exact: true });
  }

  public async goto() {
    await this.page.goto("/web/index.php/auth/login");
  }

  public async login(username: string, password?: string) {
    await this.inputUsername.fill(username);
    await this.inputPassword.fill(password ?? LoginPage.credentials[username]);
    await this.loginButton.click();
  }

  public async apiLogout() {
    await this.page.goto("/web/index.php/auth/logout");
  }
}
