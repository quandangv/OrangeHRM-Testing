import { expect, Locator, Page } from "@playwright/test";

export default abstract class BasePage {
  public readonly page: Page;
  public abstract get identifier(): Locator;

  public get loginButton() {
    // The login button is included in the base page because every page have to access it to see if it has been logged out
    return this.page.locator('//button[@type="submit"]');
  }

  constructor(page: Page | BasePage) {
    if (page instanceof BasePage) this.page = page.page;
    else this.page = page;
  }

  /**
   * Get the element that comes after a specified label
   * @param label The label to be used to locate the element
   * @param extra An extra string to add to the end of the XPath
   */
  public getLabelledElement(label: string, extra: string = "") {
    return this.page.locator(
      `//div[label[normalize-space(text())="${label}"]]/following-sibling::div` +
        extra
    );
  }

  /**
   * Open the specified dropdown and select a value
   * @param label The label of the dropdown
   * @param value The exact text of the option to select
   */
  public async selectDropdown(label: string, value: string) {
    await this.getLabelledElement(label).click();
    await this.page
      .getByRole("option", { name: value, exact: true })
      .click({ timeout: 10000 });
  }

  public async getAllOptions(filterName: string) {
    const element = this.getLabelledElement(filterName);
    await element.click();
    return (
      await Promise.all(
        (
          await element.getByRole("option").all()
        ).map((item) => item.innerText())
      )
    ).filter((item) => item != "-- Select --");
  }
}
