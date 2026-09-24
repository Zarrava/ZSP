/**
 * Platform DOM customization for hiding Microsoft / SharePoint chrome on published pages.
 *
 * IMPORTANT: This is an intentional, unsupported platform-DOM customization.
 * Selectors may require maintenance if Microsoft changes SharePoint markup.
 * All selectors are centralized here for safe updates.
 */

export const ZEF_CHROME_BODY_CLASS = 'zef-chrome-hidden';
export const ZEF_CHROME_STYLE_ID = 'zef-sharepoint-chrome-override';
export const ZEF_NAVBAR_HEIGHT_VAR = '--zef-navbar-height';
export const ZEF_CUSTOM_NAVBAR_ATTR = 'data-zef-custom-navbar';
export const ZEF_CHROME_HIDDEN_ATTR = 'data-zef-chrome-hidden';

/**
 * Leaf/platform chrome elements safe to hide directly.
 * Do NOT include page wrappers (.ms-compositeHeader, #spPageChrome, #spSiteHeader).
 */
export const SHAREPOINT_PLATFORM_CHROME_SELECTORS: readonly string[] = [
  '#SuiteNavWrapper',
  '#SuiteNavPlaceHolder',
  '#O365_MainLink_Nav_Menu',
  'div[data-automationid="O365MainHeader"]',
  'div[data-automation-id="O365MainHeader"]',
  'div[data-automationid="HorizontalNav"]',
  'div[data-automation-id="HorizontalNav"]',
  'div[data-automationid="HubNav"]',
  'div[data-automation-id="HubNav"]',
  'div[data-automationid="SiteNavigation"]',
  'div[data-automation-id="SiteNavigation"]',
  'div[data-automationid="SiteTitle"]',
  'div[data-automation-id="SiteTitle"]',
  '[data-automationid="SiteHeaderFollowButton"]',
  '[data-automation-id="SiteHeaderFollowButton"]',
  '.ms-core-listMenu-horizontalBox',
  '.ms-core-listMenu-horizontal',
  '#sp-appBar',
  'div[data-automationid="AppBar"]',
  'div[data-automation-id="AppBar"]'
];

/**
 * Chrome sections inside site header hosts — hidden via CSS child selectors
 * so we never collapse a parent that also hosts the SPFx Top placeholder.
 */
export const SHAREPOINT_SITE_HEADER_CHILD_SELECTORS: readonly string[] = [
  '[data-automationid="HorizontalNav"]',
  '[data-automation-id="HorizontalNav"]',
  '[data-automationid="SiteTitle"]',
  '[data-automation-id="SiteTitle"]',
  '[data-automationid="SiteNavigation"]',
  '[data-automation-id="SiteNavigation"]',
  '[data-automationid="SiteHeaderFollowButton"]',
  '[data-automation-id="SiteHeaderFollowButton"]',
  '.ms-core-listMenu-horizontalBox',
  '.ms-core-listMenu-horizontal'
];

/** Page content / authoring surfaces that must never be hidden. */
export const SHAREPOINT_PROTECTED_SELECTORS: readonly string[] = [
  '#spPageCanvasContent',
  '[data-sp-placeholder="Top"]',
  '[data-sp-placeholder="Bottom"]',
  `[${ZEF_CUSTOM_NAVBAR_ATTR}]`,
  '[data-automation-id="CanvasZone"]',
  '[data-automation-id="CanvasSection"]',
  '[data-automation-id="CanvasControl"]',
  '[data-automationid="PageCommandBar"]',
  '[data-automation-id="PageCommandBar"]',
  '.ms-Layer',
  '.ms-Modal',
  '.ms-Panel',
  '.ms-Callout',
  '#spLeftNav',
  'iframe',
  '[role="dialog"]',
  '[role="alertdialog"]'
];

export const ZEF_NAVBAR_HEIGHT_PX = 64;
export const ZEF_NAVBAR_HEIGHT_MOBILE_PX = 56;

/**
 * Detects SharePoint modern page edit / authoring mode.
 * PageCommandBar is present in published view and must NOT trigger edit mode.
 */
export function isSharePointPageEditMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('Mode') ?? params.get('mode');
    if (mode?.toLowerCase() === 'edit') {
      return true;
    }

    const action = params.get('action');
    if (action?.toLowerCase() === 'edit') {
      return true;
    }

    if (document.body.classList.contains('sp-edit-mode')) {
      return true;
    }

    if (document.querySelector('[data-automation-id="CanvasZoneEdit"], [data-automation-id="canvasZoneEdit"]')) {
      return true;
    }

    if (document.querySelector('[data-automation-id="CanvasControlEdit"], [data-automation-id="canvasControlEdit"]')) {
      return true;
    }

    return false;
  }
  catch {
    return false;
  }
}

export function elementContainsProtectedContent(element: Element): boolean {
  try {
    return !!(
      element.querySelector('[data-sp-placeholder="Top"]')
      || element.querySelector(`[${ZEF_CUSTOM_NAVBAR_ATTR}]`)
      || element.querySelector('#spPageCanvasContent')
    );
  }
  catch {
    return false;
  }
}

export function isProtectedChromeElement(element: Element): boolean {
  if (element.matches(`[${ZEF_CUSTOM_NAVBAR_ATTR}]`)) {
    return true;
  }

  if (element.closest(`[${ZEF_CUSTOM_NAVBAR_ATTR}]`)) {
    return true;
  }

  if (element.closest('[data-sp-placeholder="Top"]')) {
    return true;
  }

  if (element.closest('#spPageCanvasContent')) {
    return true;
  }

  if (elementContainsProtectedContent(element)) {
    return true;
  }

  return SHAREPOINT_PROTECTED_SELECTORS.some((selector) => {
    try {
      return element.matches(selector);
    }
    catch {
      return false;
    }
  });
}

function buildSiteHeaderChildHideCss(): string {
  const childSelectorList = SHAREPOINT_SITE_HEADER_CHILD_SELECTORS.join(',\n  ');
  return `
body.${ZEF_CHROME_BODY_CLASS} #spSiteHeader ${childSelectorList},
body.${ZEF_CHROME_BODY_CLASS} div[data-automationid="SiteHeader"] ${childSelectorList},
body.${ZEF_CHROME_BODY_CLASS} div[data-automation-id="SiteHeader"] ${childSelectorList},
body.${ZEF_CHROME_BODY_CLASS} header[data-automationid="SiteHeader"] ${childSelectorList},
body.${ZEF_CHROME_BODY_CLASS} header[data-automation-id="SiteHeader"] ${childSelectorList} {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}

body.${ZEF_CHROME_BODY_CLASS} #spSiteHeader,
body.${ZEF_CHROME_BODY_CLASS} div[data-automationid="SiteHeader"],
body.${ZEF_CHROME_BODY_CLASS} div[data-automation-id="SiteHeader"],
body.${ZEF_CHROME_BODY_CLASS} header[data-automationid="SiteHeader"],
body.${ZEF_CHROME_BODY_CLASS} header[data-automation-id="SiteHeader"] {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}`;
}

export function buildSharePointChromeHideCss(): string {
  const hideRules = SHAREPOINT_PLATFORM_CHROME_SELECTORS
    .map((selector) => (
      `body.${ZEF_CHROME_BODY_CLASS} ${selector} {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}`
    ))
    .join('\n');

  return `
${hideRules}
${buildSiteHeaderChildHideCss()}

body.${ZEF_CHROME_BODY_CLASS} {
  ${ZEF_NAVBAR_HEIGHT_VAR}: ${ZEF_NAVBAR_HEIGHT_PX}px;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  body.${ZEF_CHROME_BODY_CLASS} {
    ${ZEF_NAVBAR_HEIGHT_VAR}: ${ZEF_NAVBAR_HEIGHT_MOBILE_PX}px;
  }
}

body.${ZEF_CHROME_BODY_CLASS} #spPageCanvasContent,
body.${ZEF_CHROME_BODY_CLASS} .SPPageChrome-appWrapper {
  padding-top: var(${ZEF_NAVBAR_HEIGHT_VAR}, ${ZEF_NAVBAR_HEIGHT_PX}px) !important;
  margin-top: 0 !important;
}

body.${ZEF_CHROME_BODY_CLASS} [data-sp-placeholder="Top"] {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  width: 100%;
  margin: 0;
  padding: 0;
  pointer-events: auto;
  display: block !important;
  visibility: visible !important;
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

body.${ZEF_CHROME_BODY_CLASS} [${ZEF_CUSTOM_NAVBAR_ATTR}] {
  display: block !important;
  visibility: visible !important;
}

body.${ZEF_CHROME_BODY_CLASS} .SPPageChrome,
body.${ZEF_CHROME_BODY_CLASS} #spPageChrome {
  padding-top: 0 !important;
  margin-top: 0 !important;
}
`.trim();
}

export function applySharePointDomChromeHiding(): void {
  if (isSharePointPageEditMode()) {
    return;
  }

  SHAREPOINT_PLATFORM_CHROME_SELECTORS.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((element) => {
        if (isProtectedChromeElement(element)) {
          return;
        }

        const htmlElement = element as HTMLElement;
        htmlElement.setAttribute(ZEF_CHROME_HIDDEN_ATTR, 'true');
        htmlElement.style.setProperty('display', 'none', 'important');
        htmlElement.style.setProperty('visibility', 'hidden', 'important');
        htmlElement.style.setProperty('height', '0', 'important');
        htmlElement.style.setProperty('overflow', 'hidden', 'important');
        htmlElement.style.setProperty('pointer-events', 'none', 'important');
      });
    }
    catch {
      // Fail safely per selector.
    }
  });
}

export function removeSharePointDomChromeHiding(): void {
  try {
    document.querySelectorAll(`[${ZEF_CHROME_HIDDEN_ATTR}="true"]`).forEach((element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.removeAttribute(ZEF_CHROME_HIDDEN_ATTR);
      htmlElement.style.removeProperty('display');
      htmlElement.style.removeProperty('visibility');
      htmlElement.style.removeProperty('height');
      htmlElement.style.removeProperty('overflow');
      htmlElement.style.removeProperty('pointer-events');
    });
  }
  catch {
    // Fail safely.
  }
}

export interface ISharePointChromeController {
  refresh(): void;
  dispose(): void;
}

const NOOP_CHROME_CONTROLLER: ISharePointChromeController = {
  refresh: () => {
    // Fail-safe no-op when chrome hiding cannot be initialized.
  },
  dispose: () => {
    // Fail-safe no-op.
  }
};

/**
 * Applies or removes isolated platform chrome hiding for normal viewing mode.
 * Never throws — returns a no-op controller if initialization fails.
 */
export function createSharePointChromeController(): ISharePointChromeController {
  try {
    return createSharePointChromeControllerInternal();
  }
  catch {
    return NOOP_CHROME_CONTROLLER;
  }
}

function createSharePointChromeControllerInternal(): ISharePointChromeController {
  let editModeObserver: MutationObserver | undefined;
  let popStateHandler: (() => void) | undefined;
  let hashChangeHandler: (() => void) | undefined;
  let refreshTimer: number | undefined;

  const ensureStyleElement = (): HTMLStyleElement | null => {
    try {
      if (typeof document === 'undefined') {
        return null;
      }

      let styleElement = document.getElementById(ZEF_CHROME_STYLE_ID) as HTMLStyleElement | null;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = ZEF_CHROME_STYLE_ID;
        styleElement.type = 'text/css';
        styleElement.textContent = buildSharePointChromeHideCss();
        document.head.appendChild(styleElement);
      }

      return styleElement;
    }
    catch {
      return null;
    }
  };

  const enableChromeHiding = (): void => {
    try {
      if (!document.body) {
        return;
      }

      ensureStyleElement();
      document.body.classList.add(ZEF_CHROME_BODY_CLASS);
      applySharePointDomChromeHiding();
    }
    catch {
      // Fail safely — leave native SharePoint chrome visible.
    }
  };

  const disableChromeHiding = (): void => {
    try {
      if (!document.body) {
        return;
      }

      document.body.classList.remove(ZEF_CHROME_BODY_CLASS);
      removeSharePointDomChromeHiding();
    }
    catch {
      // Fail safely.
    }
  };

  const refresh = (): void => {
    if (isSharePointPageEditMode()) {
      disableChromeHiding();
      return;
    }

    enableChromeHiding();
  };

  const scheduleRefresh = (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    if (refreshTimer !== undefined) {
      window.clearTimeout(refreshTimer);
    }

    refreshTimer = window.setTimeout(() => {
      refreshTimer = undefined;
      refresh();
    }, 150);
  };

  const dispose = (): void => {
    disableChromeHiding();

    if (refreshTimer !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }

    try {
      const styleElement = document.getElementById(ZEF_CHROME_STYLE_ID);
      styleElement?.parentElement?.removeChild(styleElement);
    }
    catch {
      // Fail safely.
    }

    if (editModeObserver) {
      editModeObserver.disconnect();
      editModeObserver = undefined;
    }

    if (popStateHandler) {
      window.removeEventListener('popstate', popStateHandler);
      popStateHandler = undefined;
    }

    if (hashChangeHandler) {
      window.removeEventListener('hashchange', hashChangeHandler);
      hashChangeHandler = undefined;
    }
  };

  const watchEditMode = (): void => {
    try {
      if (
        typeof window === 'undefined'
        || typeof MutationObserver === 'undefined'
        || !document.body
      ) {
        return;
      }

      editModeObserver = new MutationObserver(() => {
        scheduleRefresh();
      });

      editModeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        childList: false,
        subtree: false
      });

      popStateHandler = scheduleRefresh;
      hashChangeHandler = scheduleRefresh;
      window.addEventListener('popstate', popStateHandler);
      window.addEventListener('hashchange', hashChangeHandler);
    }
    catch {
      // Fail safely.
    }
  };

  ensureStyleElement();
  refresh();
  watchEditMode();

  return {
    refresh,
    dispose
  };
}
