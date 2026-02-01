import { describe, expect, it } from "vitest";
import { getMessagesForLocale, SUPPORTED_LOCALES } from "@/lib/i18n";

describe("i18n", () => {
  describe("SUPPORTED_LOCALES", () => {
    it("includes English and Norwegian", () => {
      expect(SUPPORTED_LOCALES).toContain("en");
      expect(SUPPORTED_LOCALES).toContain("no");
    });

    it("has exactly 2 supported locales", () => {
      expect(SUPPORTED_LOCALES).toHaveLength(2);
    });
  });

  describe("getMessagesForLocale", () => {
    it("returns English messages for 'en' locale", () => {
      const messages = getMessagesForLocale("en");
      expect(messages.brand).toBe("Redacted");
      expect(messages.language.english).toBe("English");
    });

    it("returns Norwegian messages for 'no' locale", () => {
      const messages = getMessagesForLocale("no");
      expect(messages.brand).toBe("Redacted");
      expect(messages.language.norwegian).toBe("Norsk");
    });

    it("defaults to English for unknown locale", () => {
      // @ts-expect-error - testing invalid locale
      const messages = getMessagesForLocale("fr");
      expect(messages.language.english).toBe("English");
    });

    it("contains required navigation keys", () => {
      const messages = getMessagesForLocale("en");
      expect(messages.nav).toBeDefined();
      expect(messages.nav.play).toBeDefined();
      expect(messages.nav.board).toBeDefined();
    });

    it("contains required play section keys", () => {
      const messages = getMessagesForLocale("en");
      expect(messages.play).toBeDefined();
      expect(messages.play.taskSection).toBeDefined();
      expect(messages.play.hint).toBeDefined();
      expect(messages.play.submit).toBeDefined();
    });

    it("contains required hero section keys", () => {
      const messages = getMessagesForLocale("en");
      expect(messages.hero).toBeDefined();
      expect(messages.hero.title).toBeDefined();
      expect(messages.hero.subtitle).toBeDefined();
      expect(messages.hero.bullets).toBeInstanceOf(Array);
    });
  });
});
