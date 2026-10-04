import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Card, CustomBadge, DemoTag, F, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { getDb, schema as s } from '@/lib/db';
import { capitalize, centsInput, formatDate, formatDateTime, formatTime } from '@/lib/format';
import { customStatusLabel } from '@/lib/labels';
import { customUrl } from '@/lib/notify';
import { customUpdate } from '../../../actions';

export const metadata = { title: 'Demande personnalisée' };

/** Étapes proposées selon le statut actuel. */
const nextSteps: Record<string, ('reviewing' | 'accepted' | 'refused' | 'in_preparation' | 'ready' | 'collected')[]> = {
  new_request: ['reviewing', 'accepted', 'refused'],
  reviewing: ['accepted', 'refused'],
  quote_sent: ['accepted', 'refused'],
  accepted: ['in_preparation', 'refused'],
  in_preparation: ['ready'],
  ready: ['collected'],
  refused: ['reviewing'],
  collected: [],
};

export default async function CustomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const [c] = await db
    .select()
    .from(s.customOrders)
    .where(eq(s.customOrders.id, id))
    .catch(() => []);
  if (!c) notFound();
  const notes = await db.select().from(s.notifications).where(eq(s.notifications.customOrderId, c.id)).orderBy(desc(s.notifications.createdAt));
  const back = `/admin/personnalisees/${c.id}`;
  return (
    <>
      <PageTitle title={`${c.type} · ${c.servings} personnes`} sub={`${c.number} · reçue le ${formatDateTime(c.createdAt)}`}>
        <Link className="abtn abtn--ghost" href="/admin/personnalisees">
          ← Demandes
        </Link>
      </PageTitle>
      <div className="abtns" style={{ marginBottom: 14 }}>
        <CustomBadge status={c.status} />
        <DemoTag show={c.isDemo} />
      </div>
      <div className="agrid">
        <div className="astack">
          <Card title="La demande">
            <dl className="adl">
              <div>
                <dt>Création</dt>
                <dd className="strong">{c.type}</dd>
              </div>
              <div>
                <dt>Date souhaitée</dt>
                <dd className="strong">
                  {capitalize(formatDate(c.desiredDate, 'full'))}
                  {c.pickupTime && ` à ${formatTime(c.pickupTime)}`}
                </dd>
              </div>
              <div>
                <dt>Personnes</dt>
                <dd>{c.servings}</dd>
              </div>
              <div>
                <dt>Saveurs</dt>
                <dd>{c.flavors ?? '—'}</dd>
              </div>
              <div>
                <dt>Thème</dt>
                <dd>{c.theme ?? '—'}</dd>
              </div>
              <div>
                <dt>Texte à inscrire</dt>
                <dd>{c.inscription ? `« ${c.inscription} »` : '—'}</dd>
              </div>
              <div>
                <dt>Budget indicatif</dt>
                <dd>{c.budget ?? '—'}</dd>
              </div>
              <div>
                <dt>Commentaires</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{c.comment ?? '—'}</dd>
              </div>
            </dl>
            {c.images.length > 0 && (
              <>
                <p className="afield-label">Images d’inspiration (privées)</p>
                <div className="aimages">
                  {c.images.map((ref) => {
                    const src = '/api/admin/files/' + ref.replace(/^db:/, '');
                    return (
                      <a key={ref} href={src} target="_blank" rel="noopener">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="Inspiration envoyée par le client" />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          <Card title="Devis">
            <p className="amuted">Le client reçoit le prix et votre message par e-mail, avec un lien pour accepter le devis en ligne.</p>
            <form action={customUpdate} className="aform aform--grid">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="intent" value="quote" />
              <input type="hidden" name="back" value={back} />
              <F label="Prix TTC (€)">
                <input name="quote" inputMode="decimal" required defaultValue={centsInput(c.quoteCents)} />
              </F>
              <F label="Heure de retrait">
                <input name="pickupTime" type="time" defaultValue={c.pickupTime ?? ''} />
              </F>
              <F label="Message au client" full>
                <textarea name="message" rows={3} maxLength={1500} defaultValue={c.quoteMessage ?? ''} placeholder="Ex. Proposition : entremets chocolat-framboise, décor licorne…" />
              </F>
              <Submit className="abtn abtn--accent">{c.status === 'quote_sent' ? 'Renvoyer le devis' : 'Envoyer le devis'}</Submit>
            </form>
          </Card>
        </div>

        <div className="astack">
          <Card title="Faire avancer">
            <div className="astatus-flow">
              {(nextSteps[c.status] ?? []).map((st) => (
                <form key={st} action={customUpdate}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="intent" value="status" />
                  <input type="hidden" name="status" value={st} />
                  <input type="hidden" name="back" value={back} />
                  <Submit className={'abtn abtn--sm ' + (st === 'refused' ? 'abtn--danger' : st === 'accepted' ? 'abtn--ok' : '')} confirm={st === 'refused' ? 'Refuser cette demande ? Le client sera prévenu par e-mail.' : undefined}>
                    {customStatusLabel[st]}
                  </Submit>
                </form>
              ))}
              {!(nextSteps[c.status] ?? []).length && <span className="amuted">Demande terminée.</span>}
            </div>
            <p className="amuted">Le client est prévenu par e-mail quand la demande est acceptée, refusée ou prête.</p>
          </Card>
          <Card title="Client">
            <dl className="adl">
              <div>
                <dt>Nom</dt>
                <dd>
                  {c.firstName} {c.lastName}
                  {c.customerId && (
                    <>
                      {' '}
                      ·{' '}
                      <Link className="alink" href={`/admin/clients/${c.customerId}`}>
                        fiche
                      </Link>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>
                  <a href={`tel:${c.phone}`}>{c.phone}</a>
                </dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </dd>
              </div>
              <div>
                <dt>Lien de suivi</dt>
                <dd>
                  <a className="alink" href={customUrl(c)} target="_blank" rel="noopener">
                    Page client ↗
                  </a>
                </dd>
              </div>
            </dl>
          </Card>
          <Card title="Note interne">
            <form action={customUpdate} className="aform">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="intent" value="note" />
              <input type="hidden" name="back" value={back} />
              <textarea name="internalNote" rows={3} maxLength={2000} defaultValue={c.internalNote ?? ''} aria-label="Note interne" />
              <Submit className="abtn abtn--ghost">Enregistrer la note</Submit>
            </form>
          </Card>
          {notes.length > 0 && (
            <Card title="Historique">
              <ul className="alist">
                {notes.map((n) => (
                  <li key={n.id}>
                    {formatDateTime(n.createdAt)} — {n.subject} {n.channel === 'email' && <span className={'astatus-' + n.status}>({n.status === 'sent' ? 'envoyé' : n.status === 'skipped' ? 'e-mail non configuré' : n.status})</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
