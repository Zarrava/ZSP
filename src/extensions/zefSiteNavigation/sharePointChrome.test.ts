import {
  applySharePointDomChromeHiding,
  buildSharePointChromeHideCss,
  createSharePointChromeController,
  elementContainsProtectedContent,
  isProtectedChromeElement,
  isSharePointPageEditMode,
  removeSharePointDomChromeHiding,
  SHAREPOINT_PLATFORM_CHROME_SELECTORS,
  ZEF_CHROME_BODY_CLASS,
  ZEF_CUSTOM_NAVBAR_ATTR
} from './sharePointChrome';

describe('sharePointChrome', () => {
  afterEach(() => {
    removeSharePointDomChromeHiding();
    document.body.innerHTML = '';
    document.body.className = '';
    document.getElementById('zef-sharepoint-chrome-override')?.remove();
  });

  it('builds CSS that scopes platform hiding to the ZEF body class', () => {
    const css = buildSharePointChromeHideCss();

    expect(css).toContain(`body.${ZEF_CHROME_BODY_CLASS}`);
    expect(css).toContain('#SuiteNavWrapper');
    expect(css).toContain('#spSiteHeader');
    expect(css).toContain(ZEF_CUSTOM_NAVBAR_ATTR);
    expect(css).not.toContain('.ms-compositeHeader');
    expect(css).not.toContain('* {');
  });

  it('does not hide entire site header hosts in generated CSS', () => {
    const css = buildSharePointChromeHideCss();

    expect(css).not.toMatch(/body\.zef-chrome-hidden #spSiteHeader \{[^}]*display: none/);
    expect(css).toContain('#spSiteHeader [data-automationid="HorizontalNav"]');
  });

  it('documents all platform chrome selectors in generated CSS', () => {
    const css = buildSharePointChromeHideCss();

    SHAREPOINT_PLATFORM_CHROME_SELECTORS.forEach((selector) => {
      expect(css).toContain(selector);
    });
  });

  it('detects edit mode from URL query parameters', () => {
    const originalPath = `${window.location.pathname}${window.location.search}`;

    window.history.pushState({}, '', `${window.location.pathname}?Mode=Edit`);
    expect(isSharePointPageEditMode()).toBe(true);

    window.history.pushState({}, '', `${window.location.pathname}?action=edit`);
    expect(isSharePointPageEditMode()).toBe(true);

    window.history.pushState({}, '', originalPath);
  });

  it('does not treat PageCommandBar alone as edit mode', () => {
    const commandBar = document.createElement('div');
    commandBar.setAttribute('data-automation-id', 'PageCommandBar');
    document.body.appendChild(commandBar);

    expect(isSharePointPageEditMode()).toBe(false);
  });

  it('does not hide site header hosts that contain the Top placeholder', () => {
    document.body.innerHTML = `
      <div id="spSiteHeader" data-automationid="SiteHeader">
        <div data-sp-placeholder="Top">
          <div ${ZEF_CUSTOM_NAVBAR_ATTR}="true">Custom navbar</div>
        </div>
        <div data-automationid="HorizontalNav">Native nav</div>
      </div>
      <div id="spPageCanvasContent">Page content</div>
    `;

    const siteHeader = document.getElementById('spSiteHeader') as HTMLElement;
    expect(elementContainsProtectedContent(siteHeader)).toBe(true);
    expect(isProtectedChromeElement(siteHeader)).toBe(true);

    applySharePointDomChromeHiding();
    expect(siteHeader.style.display).not.toBe('none');
  });

  it('protects the custom ZEF navbar from DOM hiding', () => {
    document.body.innerHTML = `
      <div id="spSiteHeader">
        <div ${ZEF_CUSTOM_NAVBAR_ATTR}="true" class="zef-nav">Custom navbar</div>
      </div>
    `;

    const navbar = document.querySelector(`[${ZEF_CUSTOM_NAVBAR_ATTR}]`) as HTMLElement;
    expect(isProtectedChromeElement(navbar)).toBe(true);

    applySharePointDomChromeHiding();
    expect(navbar.style.display).not.toBe('none');
  });

  it('hides native SharePoint chrome in published mode', () => {
    document.body.innerHTML = `
      <div id="SuiteNavWrapper">Suite nav</div>
      <div data-automationid="HorizontalNav">Native nav</div>
      <div ${ZEF_CUSTOM_NAVBAR_ATTR}="true">Custom navbar</div>
    `;

    applySharePointDomChromeHiding();

    const suiteNav = document.getElementById('SuiteNavWrapper') as HTMLElement;
    const nativeNav = document.querySelector('[data-automationid="HorizontalNav"]') as HTMLElement;
    const customNavbar = document.querySelector(`[${ZEF_CUSTOM_NAVBAR_ATTR}]`) as HTMLElement;

    expect(suiteNav.style.display).toBe('none');
    expect(nativeNav.style.display).toBe('none');
    expect(customNavbar.style.display).not.toBe('none');
  });

  it('skips DOM hiding in edit mode', () => {
    const originalPath = `${window.location.pathname}${window.location.search}`;
    document.body.innerHTML = '<div id="SuiteNavWrapper">Suite nav</div>';
    const suiteNav = document.getElementById('SuiteNavWrapper') as HTMLElement;

    window.history.pushState({}, '', `${window.location.pathname}?Mode=Edit`);
    applySharePointDomChromeHiding();
    expect(suiteNav.style.display).toBe('');

    window.history.pushState({}, '', originalPath);
  });

  it('tolerates missing SharePoint DOM elements without throwing', () => {
    document.body.innerHTML = '';

    expect(() => applySharePointDomChromeHiding()).not.toThrow();
    expect(() => removeSharePointDomChromeHiding()).not.toThrow();
    expect(() => createSharePointChromeController().refresh()).not.toThrow();
    expect(() => createSharePointChromeController().dispose()).not.toThrow();
  });

  it('createSharePointChromeController never throws when DOM operations fail', () => {
    const originalQuerySelectorAll = document.querySelectorAll.bind(document);
    document.querySelectorAll = () => {
      throw new Error('DOM unavailable');
    };

    let controller: ReturnType<typeof createSharePointChromeController> | undefined;
    expect(() => {
      controller = createSharePointChromeController();
    }).not.toThrow();

    expect(controller).toBeDefined();
    expect(() => controller?.refresh()).not.toThrow();
    expect(() => controller?.dispose()).not.toThrow();

    document.querySelectorAll = originalQuerySelectorAll;
  });

  it('createSharePointChromeController returns a no-op controller when initialization fails', () => {
    const originalBody = document.body;
    Object.defineProperty(document, 'body', {
      configurable: true,
      get: () => {
        throw new Error('body unavailable');
      }
    });

    const controller = createSharePointChromeController();
    expect(() => controller.refresh()).not.toThrow();
    expect(() => controller.dispose()).not.toThrow();

    Object.defineProperty(document, 'body', {
      configurable: true,
      value: originalBody
    });
  });
});

