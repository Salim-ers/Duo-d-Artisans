import { site, fullAddress } from '@/data/site';
import { Arrow } from '@/components/ui/Arrow';

export function FinalCTA() {
  return (
    <section className="section bg-deep grain final">
      {/* Easter egg 02 — quelques particules de farine, desktop uniquement */}
      <span className="flour" aria-hidden="true" />
      <div className="container b">
        <h2 className="display d-xl reveal">À demain matin ?</h2>
        <p className="lede sub reveal" data-delay=".08s">
          {site.name} vous accueille au {fullAddress}.
        </p>
        <div className="final-actions reveal" data-delay=".14s">
          <a className="btn btn--light" href={site.maps.directions} target="_blank" rel="noopener">Nous trouver<Arrow /></a>
          <a className="btn btn--outline-light" href={site.phone.href}>{site.phone.display}</a>
        </div>
      </div>
    </section>
  );
}
