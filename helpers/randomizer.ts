export default class Randomizer {
  static characters =
    "1234567890QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm";

  /**
   * Returns a random integer between 0 (inclusive) and the parameter A (exclusive)
   */
  public static int(a: number) {
    return Math.trunc(Math.random() * a);
  }

  /** Returns a random item in the list */
  public static choose<T>(list: { length: number; [i: number]: T }): T {
    return list[this.int(list.length)];
  }

  /** Returns a random string of specified length */
  public static str(length: number) {
    return new Array(length)
      .fill(0)
      .map((_) => this.choose(this.characters))
      .join("");
  }

  /**
   * Returns a list of random strings with no duplicates
   * @param length The length of each string
   * @param count The number of strings in the list
   */
  public static uniqueStrings(length: number, count: number) {
    const result: string[] = [];
    for (let c = 0; c < count; c++) {
      result[c] = this.str(length);
      let duplicate = 0;
      for (; duplicate < c; duplicate++)
        if (result[duplicate] == result[c]) break;
      if (duplicate < c) {
        c--;
        continue;
      }
    }
    return result;
  }

  /**
   * Randomly shuffles a list, or randomly choose a number of elements and swap them to the front
   * @param list the list to be shuffled
   * @param iterations if null or equals to the list length, this shuffles the whole list. Otherwise, it randomly chooses that number of elements and swap them to the front
   */
  public static shuffle<T>(list: T[], iterations?: number) {
    if (iterations == null || iterations > list.length)
      iterations = list.length;
    for (let i = 0; i < iterations - 1; i++) {
      const j = i + this.int(list.length - i);
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
    return list;
  }

  /**
   * Returns a random date in the past
   * @param maxDays The maximum number of days in the past to use
   */
  public static pastDate(maxDays = 20) {
    let day = new Date();
    day.setDate(day.getDate() - Math.trunc(Math.random() * maxDays));
    return day;
  }
}
