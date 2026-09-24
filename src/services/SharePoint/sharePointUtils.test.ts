import {
  compareAnnouncementPriority,
  isSharePointItemExpired,
  isSharePointItemPublished,
  isSharePointPlaceholderValue,
  isValidSharePointUrl,
  resolveSharePointUrlSafe
} from './sharePointUtils';

describe('sharePointUtils', () => {
  describe('placeholder URL rejection', () => {
    it('detects provisioning placeholder tokens', () => {
      expect(isSharePointPlaceholderValue('[INSERT ACTUAL URL]')).toBe(true);
      expect(isSharePointPlaceholderValue('[INSERT ACTUAL ZEF URL]')).toBe(true);
    });

    it('rejects placeholder and invalid URLs', () => {
      expect(isValidSharePointUrl('[INSERT ACTUAL URL]')).toBe(false);
      expect(isValidSharePointUrl('')).toBe(false);
      expect(isValidSharePointUrl('not-a-url')).toBe(false);
    });

    it('accepts valid http(s) URLs', () => {
      expect(isValidSharePointUrl('https://zurfteempowercare.sharepoint.com/sites/ZEF')).toBe(true);
      expect(isValidSharePointUrl('https://support.microsoft.com/microsoft-365')).toBe(true);
    });

    it('resolves hyperlink objects and excludes placeholders', () => {
      expect(resolveSharePointUrlSafe({ Url: '[INSERT ACTUAL URL]' })).toBeUndefined();
      expect(resolveSharePointUrlSafe({ Url: 'https://example.org/doc' })).toBe('https://example.org/doc');
    });
  });

  describe('announcement priority', () => {
    it('orders Urgent before Important before Normal', () => {
      expect(compareAnnouncementPriority('Urgent', 'Important')).toBeLessThan(0);
      expect(compareAnnouncementPriority('Important', 'Normal')).toBeLessThan(0);
      expect(compareAnnouncementPriority('Normal', 'Urgent')).toBeGreaterThan(0);
    });
  });

  describe('announcement publish and expiry', () => {
    const now = new Date('2026-09-20T12:00:00');

    it('treats today and past published dates as published', () => {
      expect(isSharePointItemPublished('2026-09-20T08:00:00Z', now)).toBe(true);
      expect(isSharePointItemPublished('2026-09-19T08:00:00Z', now)).toBe(true);
    });

    it('treats future published dates as unpublished', () => {
      expect(isSharePointItemPublished('2026-09-21T08:00:00Z', now)).toBe(false);
    });

    it('expires items after the expiry calendar day', () => {
      expect(isSharePointItemExpired('2026-09-19', now)).toBe(true);
      expect(isSharePointItemExpired('2026-09-20', now)).toBe(false);
      expect(isSharePointItemExpired('2026-12-31', now)).toBe(false);
    });
  });
});
