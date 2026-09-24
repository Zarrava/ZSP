import { IZefWorkplaceConfig } from './IZefWorkplaceConfig';

/**
 * Default workplace configuration.
 * Tenant-specific URLs are derived at runtime from SPFx context where possible.
 */
export const defaultWorkplaceConfig: IZefWorkplaceConfig = {
  useMockDataInLocalDev: true,

  sharePoint: {
    announcements: {
      listTitle: 'ZEF Announcements',
      fields: {
        title: 'Title',
        body: 'Body',
        category: 'Category',
        publishedDate: 'PublishedDate',
        link: 'Link',
        expiryDate: 'ExpiryDate',
        priority: 'Priority'
      }
    },
    departments: {
      listTitle: 'ZEF Departments',
      fields: {
        title: 'Title',
        description: 'Description',
        sharePointSiteUrl: 'SharePointSiteUrl',
        teamsUrl: 'TeamsUrl',
        icon: 'Icon',
        sortOrder: 'SortOrder'
      }
    },
    resources: {
      listTitle: 'ZEF Resources',
      fields: {
        title: 'Title',
        description: 'Description',
        link: 'Link',
        icon: 'Icon',
        resourceCategory: 'ResourceCategory',
        audience: 'Audience'
      }
    }
  },

  quickAccess: {
    destinations: [
      {
        id: 'qa-teams',
        title: 'Teams',
        description: 'Chat & meetings',
        iconName: 'TeamsLogo',
        url: 'https://teams.microsoft.com'
      },
      {
        id: 'qa-documents',
        title: 'Documents',
        description: 'Files & libraries',
        iconName: 'Folder',
        url: ''
      },
      {
        id: 'qa-calendar',
        title: 'Calendar',
        description: 'Schedule & events',
        iconName: 'Calendar',
        url: 'https://outlook.office.com/calendar'
      },
      {
        id: 'qa-forms',
        title: 'Forms',
        description: 'Submit requests',
        iconName: 'SurveyQuestions',
        url: 'https://forms.office.com'
      },
      {
        id: 'qa-sharepoint',
        title: 'ZEF SharePoint',
        description: 'Organization site & libraries',
        iconName: 'SharepointLogo',
        url: ''
      }
    ],
    sharedDocumentsLibraryName: 'Shared Documents'
  },

  graph: {
    endpoints: {
      currentUser: '/me',
      userPhoto: '/me/photo/$value',
      events: '/me/events',
      joinedTeams: '/me/joinedTeams',
      recentDocuments: '/me/drive/recent',
      todoLists: '/me/todo/lists',
      drive: '/me/drive'
    },
    teamDeepLinkTemplate: 'https://teams.microsoft.com/l/team/{teamId}',
    tasksUrl: 'https://to-do.office.com/tasks/',
    calendarUrl: 'https://outlook.office.com/calendar',
    oneDriveUrl: ''
  },

  navigation: {},

  footer: {
    links: []
  },

  roles: {
    personalizationEnabled: false,
    executiveAssistant: {
      departmentTitle: 'Executive Assistants',
      supportedOffices: [
        'COO',
        'Lead Coordinator',
        'Administration'
      ]
    },
    roleGroupMappings: {}
  },

  futureConfigList: {
    enabled: false,
    listTitle: 'ZEF Workplace Configuration'
  }
};
