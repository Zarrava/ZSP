jest.mock('@microsoft/sp-core-library', () => ({

  Log: {

    info: jest.fn(),

    error: jest.fn()

  }

}));



jest.mock('@microsoft/sp-application-base', () => ({

  BaseApplicationCustomizer: class {

    public context!: unknown;

  },

  PlaceholderName: {

    Top: 'Top'

  }

}));



jest.mock('react-dom', () => ({

  render: jest.fn(),

  unmountComponentAtNode: jest.fn()

}));



jest.mock('./sharePointChrome', () => ({

  createSharePointChromeController: jest.fn()

}));



jest.mock('./services/ZefSiteNavigationService', () => ({

  ZefSiteNavigationService: jest.fn()

}));



import * as ReactDom from 'react-dom';

import ZefSiteNavigationApplicationCustomizer from './ZefSiteNavigationApplicationCustomizer';

import { createSharePointChromeController } from './sharePointChrome';

import { ZefSiteNavigationService } from './services/ZefSiteNavigationService';



const mockedCreateChromeController = createSharePointChromeController as jest.MockedFunction<

  typeof createSharePointChromeController

>;

const mockedNavigationService = ZefSiteNavigationService as jest.MockedClass<typeof ZefSiteNavigationService>;

const mockedRender = ReactDom.render as jest.Mock;



function assignCustomizerContext(

  customizer: ZefSiteNavigationApplicationCustomizer

): void {

  const domElement = document.createElement('div');



  Object.defineProperty(customizer, 'context', {

    configurable: true,

    value: {

      placeholderProvider: {

        changedEvent: {

          add: jest.fn()

        },

        tryCreateContent: jest.fn(() => ({

          domElement

        }))

      },

      pageContext: {

        web: {

          title: 'Zurfte Empowercare Foundation',

          absoluteUrl: 'https://zurfteempowercare.sharepoint.com/sites/ZEF'

        },

        user: {

          displayName: 'Test User',

          email: 'test.user@zef.org',

          loginName: 'test.user@zef.org'

        }

      },

      spHttpClient: {}

    }

  });

}



describe('ZefSiteNavigationApplicationCustomizer', () => {

  beforeEach(() => {

    jest.clearAllMocks();

    mockedCreateChromeController.mockReturnValue({

      refresh: jest.fn(),

      dispose: jest.fn()

    });

  });



  it('onInit always resolves even when chrome initialization fails', async () => {

    mockedCreateChromeController.mockImplementation(() => {

      throw new Error('chrome controller failed');

    });



    const customizer = new ZefSiteNavigationApplicationCustomizer();

    assignCustomizerContext(customizer);



    mockedNavigationService.mockImplementation(() => ({

      getQuickLaunchNavigation: jest.fn().mockResolvedValue([])

    }) as unknown as ZefSiteNavigationService);



    await expect(customizer.onInit()).resolves.toBeUndefined();

    expect(mockedRender).toHaveBeenCalled();

  });



  it('continues rendering when navigation loading fails', async () => {

    const customizer = new ZefSiteNavigationApplicationCustomizer();

    assignCustomizerContext(customizer);



    mockedNavigationService.mockImplementation(() => ({

      getQuickLaunchNavigation: jest.fn().mockRejectedValue(new Error('navigation unavailable'))

    }) as unknown as ZefSiteNavigationService);



    await customizer.onInit();



    expect(mockedRender).toHaveBeenCalled();

    const renderedElement = mockedRender.mock.calls[mockedRender.mock.calls.length - 1][0] as {

      props: { errorMessage?: string; isLoading: boolean };

    };

    expect(renderedElement.props.isLoading).toBe(false);

    expect(renderedElement.props.errorMessage).toBe('Navigation is temporarily unavailable.');

  });



  it('does not throw when React rendering fails', async () => {

    mockedRender.mockImplementation(() => {

      throw new Error('render failed');

    });



    const customizer = new ZefSiteNavigationApplicationCustomizer();

    assignCustomizerContext(customizer);



    mockedNavigationService.mockImplementation(() => ({

      getQuickLaunchNavigation: jest.fn().mockResolvedValue([])

    }) as unknown as ZefSiteNavigationService);



    await expect(customizer.onInit()).resolves.toBeUndefined();

  });

});


