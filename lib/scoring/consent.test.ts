import { describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog";
import {
  getConsentNoKey,
  getConsentYesKey,
  hasRefusedConsent,
  isConsentGiven,
} from "@/lib/scoring/consent";

describe("consent gate logic", () => {
  it("blocks continuation when consent is refused", () => {
    const noKey = getConsentNoKey();
    expect(noKey).toBe("B");

    const consentRefused = hasRefusedConsent([noKey!]);
    const consentOk = isConsentGiven([noKey!]);
    const unansweredCount = 0;

    const canProceed = unansweredCount === 0 && !consentRefused;
    const nextDisabled = !canProceed || !consentOk;

    expect(consentRefused).toBe(true);
    expect(consentOk).toBe(false);
    expect(canProceed).toBe(false);
    expect(nextDisabled).toBe(true);
  });

  it("allows continuation only when consent is given and section is complete", () => {
    const yesKey = getConsentYesKey();
    expect(yesKey).toBe("A");

    const consentRefused = hasRefusedConsent([yesKey!]);
    const consentOk = isConsentGiven([yesKey!]);
    const unansweredCount = 0;

    const canProceed = unansweredCount === 0 && !consentRefused;
    const nextDisabled = !canProceed || !consentOk;

    expect(consentRefused).toBe(false);
    expect(consentOk).toBe(true);
    expect(canProceed).toBe(true);
    expect(nextDisabled).toBe(false);
  });

  it("keeps next disabled when consent not yet answered", () => {
    const consentRefused = hasRefusedConsent(undefined);
    const consentOk = isConsentGiven(undefined);
    const unansweredCount = 1;

    const canProceed = unansweredCount === 0 && !consentRefused;
    const nextDisabled = !canProceed || !consentOk;

    expect(canProceed).toBe(false);
    expect(nextDisabled).toBe(true);
  });

  it("uses catalog consent question as the gate", () => {
    const catalog = getCatalog();
    const consent = catalog.questions.find((q) => q.scoringType === "Consent");
    expect(consent?.questionId).toBe("P001");
    expect(consent?.notes).toMatch(/do not continue/i);
    expect(getConsentYesKey(catalog)).toBeTruthy();
    expect(getConsentNoKey(catalog)).toBeTruthy();
  });

  it("blocks later sections when consent is missing (URL bypass guard)", () => {
    const catalog = getCatalog();
    const consentMissing = undefined;
    const onLaterSection = true;
    const firstSectionSlug = catalog.sections[0]?.slug;

    const shouldRedirectToFirst =
      Boolean(firstSectionSlug) &&
      onLaterSection &&
      !isConsentGiven(consentMissing, catalog);

    expect(shouldRedirectToFirst).toBe(true);
    expect(isConsentGiven(consentMissing, catalog)).toBe(false);
    expect(hasRefusedConsent(consentMissing, catalog)).toBe(false);
  });
});
