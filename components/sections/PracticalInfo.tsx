import { site } from '@/data/site';
import { SectionMark } from '@/components/ui/SectionMark';
import { OpenStatus } from '@/components/ui/OpenStatus';
import { OpeningHoursList } from '@/components/sections/OpeningHoursList';
import { Arrow } from '@/components/ui/Arrow';

export function PracticalInfo({ compact = false }: { compact?: boolean }) {
  return (
    <section className="section bg-cream" id="horaires">
      <div className="container info-grid">
        <div>
          {!compact && (
            <>
              <SectionMark>Informations pratiques</SectionMark>
              <h2 className="display d-l reveal" data-delay=".06s">On se retrouve<br />à Rantigny.</h2>
            </>
          )}

          <div className="info-block reveal" data-delay=".1s" style={{ marginTop: compact ? 0 : 36 }}>
            <p className="info-label">Adresse</p>
            <p className="info-value">{site.address.street}<br />{site.address.postalCode} {site.address.city}</p>
          </div>

          <div className="info-block reveal" data-delay=".14s">
            <p className="info-label">Téléphone</p>
            <p className="info-value"><a href={site.phone.href}>{site.phone.display}</a></p>
          </div>

          <div className="info-block reveal" data-delay=".18s">
            <p className="info-label">Horaires</p>
            <OpeningHoursList />
            <p style={{ marginTop: 18 }}><OpenStatus dark /></p>
          </div>

          <div className="info-actions">
            <a className="btn btn--primary" href={site.maps.directions} target="_blank" rel="noopener">Itinéraire<Arrow /></a>
            <a className="btn btn--ghost" href={site.phone.href}>Appeler la boutique</a>
          </div>
        </div>

        <div className="map clip">
          <iframe
            src={site.maps.embed}
            title={`Plan d'accès — ${site.name}, ${site.address.street}, ${site.address.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
