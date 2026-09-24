import { HeroFacade } from '@/components/sections/HeroFacade';
import { IntroEditorial } from '@/components/sections/IntroEditorial';
import { DuoSplit } from '@/components/sections/DuoSplit';
import { DayTimeline } from '@/components/sections/DayTimeline';
import { CreationsGrid } from '@/components/sections/CreationsGrid';
import { SignaturePastries } from '@/components/sections/SignaturePastries';
import { CraftWords } from '@/components/sections/CraftWords';
import { SnackingSection } from '@/components/sections/SnackingSection';
import { VitrineShowcase } from '@/components/sections/VitrineShowcase';
import { GoogleRating } from '@/components/sections/GoogleRating';
import { PracticalInfo } from '@/components/sections/PracticalInfo';
import { FinalCTA } from '@/components/sections/FinalCTA';

/**
 * Rythme chromatique : crème → photo → bleu → blanc chaud → photo → crème → bleu final.
 */
export default function HomePage() {
  return (
    <>
      <HeroFacade />
      <IntroEditorial />
      <DuoSplit />
      <DayTimeline />
      <CreationsGrid />
      <SignaturePastries />
      <CraftWords />
      <SnackingSection />
      <VitrineShowcase />
      <GoogleRating />
      <PracticalInfo />
      <FinalCTA />
    </>
  );
}
