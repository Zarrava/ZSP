import * as React from 'react';
import { IWorkplaceServices } from '../../../services/IWorkplaceServices';
import { ZefPageShell } from '../../page/ZefPageShell/ZefPageShell';
import { ZefPageHero } from '../../page/ZefPageHero/ZefPageHero';
import { ZefSection } from '../../page/ZefSection/ZefSection';
import { ZefContentGrid } from '../../page/ZefContentGrid/ZefContentGrid';
import { ZefCard } from '../../page/ZefCard/ZefCard';
import { ZefFeatureCard } from '../../page/ZefFeatureCard/ZefFeatureCard';
import { ZefCTA } from '../../page/ZefCTA/ZefCTA';
import { DEPARTMENT_CATALOG } from '../../../utils/departmentCatalog';
import {
  ZEF_ABOUT_STATEMENT,
  ZEF_CORE_FOCUS_AREAS,
  ZEF_MISSION_STATEMENT,
  ZEF_ORGANIZATIONAL_ARMS,
  ZEF_ORGANIZATION_INTRO,
  ZEF_ORGANIZATION_NAME,
  ZEF_WHO_WE_ARE_CTAS
} from '../../../content/zefOrganizationContent';

export interface IWhoWeArePageProps {
  services: IWorkplaceServices;
}

export const WhoWeArePage: React.FC<IWhoWeArePageProps> = ({ services }) => (
  <ZefPageShell footerLinks={services.config.footer.links}>
    <ZefPageHero
      id="who-we-are-heading"
      eyebrow={ZEF_ORGANIZATION_NAME}
      headline="Who we are."
      intro={ZEF_ORGANIZATION_INTRO}
    />

    <ZefSection title="About Zurfte Empowercare Foundation" eyebrow="ZEF">
      <ZefCard title={ZEF_ORGANIZATION_NAME}>
        <p>{ZEF_ABOUT_STATEMENT}</p>
      </ZefCard>
    </ZefSection>

    <ZefSection title="Our Mission" eyebrow="Zurfte Empowercare Foundation">
      <ZefCard title="Mission">
        <p>{ZEF_MISSION_STATEMENT}</p>
      </ZefCard>
    </ZefSection>

    <ZefSection title="What we focus on" eyebrow="ZEF">
      <ZefContentGrid>
        {ZEF_CORE_FOCUS_AREAS.map((area) => (
          <ZefFeatureCard
            key={area.id}
            title={area.title}
            description={area.description}
            iconName={area.iconName}
          />
        ))}
      </ZefContentGrid>
    </ZefSection>

    <ZefSection title="Our organizational arms" eyebrow="Zurfte Empowercare Foundation">
      <ZefContentGrid>
        {ZEF_ORGANIZATIONAL_ARMS.map((arm) => (
          <ZefFeatureCard
            key={arm.id}
            title={arm.title}
            description={arm.description}
            highlights={arm.highlights}
            iconName={arm.id === 'social-impact' ? 'Heart' : 'DeveloperTools'}
          />
        ))}
      </ZefContentGrid>
    </ZefSection>

    <ZefSection title="How we work" eyebrow="Zurfte Empowercare Foundation">
      <ZefContentGrid>
        {Object.keys(DEPARTMENT_CATALOG).map((teamName) => {
          const team = DEPARTMENT_CATALOG[teamName];
          return (
            <ZefFeatureCard
              key={teamName}
              title={teamName}
              description={team.description}
              iconName={team.iconName}
            />
          );
        })}
      </ZefContentGrid>
    </ZefSection>

    <ZefCTA
      title="Zurfte Empowercare Foundation home"
      description="Open the organization home for Zurfte Empowercare Foundation."
      links={ZEF_WHO_WE_ARE_CTAS}
    />
  </ZefPageShell>
);
