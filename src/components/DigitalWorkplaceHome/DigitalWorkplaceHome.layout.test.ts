import { DIGITAL_WORKPLACE_LAYOUT } from './DigitalWorkplaceHome';



describe('DigitalWorkplaceHome layout', () => {

  it('keeps the Hero outside the WorkplaceRail page grid', () => {

    expect(DIGITAL_WORKPLACE_LAYOUT.heroPlacement).toBe('above-page-layout');

  });

});


