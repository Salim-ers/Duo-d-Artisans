import { asc } from 'drizzle-orm';
import type { ReactNode } from 'react';
import { Card, F, PageTitle } from '@/components/admin/bits';
import { Submit } from '@/components/admin/ui';
import { hasRole, requirePage } from '@/lib/auth/session';
import { getDb, schema as s } from '@/lib/db';
import { dayLabels, weekOrder } from '@/data/opening-hours';
import { env, pushEnabled } from '@/lib/env';
import { formatDateTime } from '@/lib/format';
import { roleLabel } from '@/lib/labels';
import { getSetting, savedSettingKeys } from '@/lib/settings';
import {
  demoPurge,
  demoRegenerate,
  passwordChange,
  saveCatalog,
  saveCustomSettings,
  saveHours,
  saveNotify,
  saveReviews,
  userCreate,
  userUpdate,
} from '../../actions';

export const metadata = { title: 'Paramètres' };

function Unsaved({ show }: { show: boolean }) {
  return show ? <span className="atag atag--demo">Valeurs par défaut — à confirmer</span> : null;
}

function Section({ id, title, saved, children }: { id: string; title: string; saved?: boolean; children: ReactNode }) {
  return (
    <Card
      id={id}
      title={
        <>
          {title} {saved !== undefined && <Unsaved show={!saved} />}
        </>
      }
    >
      {children}
    </Card>
  );
}

export default async function SettingsPage() {
  const user = await requirePage('STAFF');
  const admin = hasRole(user, 'ADMIN');
  const db = await getDb();
  const [saved, hours, custom, reviews, notify, catalog, users] = await Promise.all([
    savedSettingKeys(),
    getSetting('hours'),
    getSetting('custom'),
    getSetting('reviews'),
    getSetting('notify'),
    getSetting('catalog'),
    admin ? db.select().from(s.users).orderBy(asc(s.users.createdAt)) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageTitle title="Paramètres" sub={admin ? 'Horaires, commandes de gâteaux, avis, notifications et équipe.' : 'Votre compte'} />
      <div className="astack">
        {admin && (
          <>
            <Section id="demo" title="Mode démonstration">
              <p>
                {catalog.demo ? (
                  <b>Activé : des demandes, clients et messages d’exemple sont affichés dans la gestion, signalés « Exemple ». Rien n’apparaît sur le site.</b>
                ) : (
                  <b>Désactivé : seules les vraies demandes et les vrais messages sont visibles.</b>
                )}
              </p>
              <form action={saveCatalog} className="abtns">
                <input type="hidden" name="demo" value={catalog.demo ? '' : 'on'} />
                <Submit className={catalog.demo ? 'abtn abtn--accent' : 'abtn abtn--ghost'} confirm={catalog.demo ? 'Masquer les exemples ? Seules les vraies demandes resteront visibles.' : undefined}>
                  {catalog.demo ? 'Désactiver (mise en production)' : 'Réactiver la démonstration'}
                </Submit>
              </form>
              <div className="abtns">
                <form action={demoRegenerate}>
                  <Submit className="abtn abtn--ghost abtn--sm">Régénérer les exemples autour d’aujourd’hui</Submit>
                </form>
                {hasRole(user, 'SUPER_ADMIN') && (
                  <form action={demoPurge}>
                    <Submit className="abtn abtn--danger abtn--sm" confirm="Supprimer définitivement toutes les demandes, clients et messages d’exemple ?">
                      Supprimer toutes les données d’exemple
                    </Submit>
                  </form>
                )}
              </div>
            </Section>

            <Section id="horaires" title="Horaires d’ouverture" saved={saved.has('hours')}>
              <p className="amuted">Affichés partout sur le site (statut « ouvert / fermé », pied de page, Google via les données structurées). Les fermetures ponctuelles se gèrent dans le Planning.</p>
              <form action={saveHours} className="aform">
                <div className="atable-wrap">
                  <table className="atable">
                    <thead>
                      <tr>
                        <th>Jour</th>
                        <th>Ouvert</th>
                        <th>Ouverture</th>
                        <th>Fermeture</th>
                        <th>Réouverture (coupure)</th>
                        <th>Fermeture</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekOrder.map((d) => {
                        const r = hours.week[d] ?? [];
                        return (
                          <tr key={d}>
                            <td className="strong">{dayLabels[d]}</td>
                            <td>
                              <input type="checkbox" name={`open-${d}`} defaultChecked={r.length > 0} aria-label={`${dayLabels[d]} ouvert`} />
                            </td>
                            <td>
                              <input type="time" name={`o1-${d}`} defaultValue={r[0]?.open ?? '07:00'} aria-label="Ouverture" />
                            </td>
                            <td>
                              <input type="time" name={`c1-${d}`} defaultValue={r[0]?.close ?? '19:00'} aria-label="Fermeture" />
                            </td>
                            <td>
                              <input type="time" name={`o2-${d}`} defaultValue={r[1]?.open ?? ''} aria-label="Réouverture" />
                            </td>
                            <td>
                              <input type="time" name={`c2-${d}`} defaultValue={r[1]?.close ?? ''} aria-label="Fermeture après coupure" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Submit>Enregistrer les horaires</Submit>
              </form>
            </Section>

            <Section id="personnalisees" title="Commandes de gâteaux" saved={saved.has('custom')}>
              <form action={saveCustomSettings} className="aform aform--grid">
                <F label="Types de création proposés (un par ligne)" full>
                  <textarea name="types" rows={6} defaultValue={custom.types.join('\n')} />
                </F>
                <F label="Délai minimum avant la date souhaitée (jours)">
                  <input type="number" name="minDaysNotice" min={0} max={90} defaultValue={custom.minDaysNotice} />
                </F>
                <Submit>Enregistrer</Submit>
              </form>
            </Section>

            <Section id="avis" title="Avis Google" saved={saved.has('reviews')}>
              <p className="amuted">Recopiez uniquement les chiffres affichés sur la fiche Google de la boutique, avec la date du relevé. Aucun avis n’est rédigé ici.</p>
              <form action={saveReviews} className="aform aform--grid">
                <F label="Note (sur 5)">
                  <input name="rating" inputMode="decimal" defaultValue={reviews.rating?.toString().replace('.', ',') ?? ''} placeholder="Vide = masquée" />
                </F>
                <F label="Nombre d’avis">
                  <input name="count" type="number" min={0} defaultValue={reviews.count ?? ''} />
                </F>
                <F label="Relevé le">
                  <input name="checkedOn" type="date" defaultValue={reviews.checkedOn ?? ''} />
                </F>
                <F label="Lien vers la fiche Google" full>
                  <input name="url" type="url" defaultValue={reviews.url ?? ''} placeholder="https://g.page/…" />
                </F>
                <Submit>Enregistrer</Submit>
              </form>
            </Section>

            <Section id="notifications" title="Notifications" saved={saved.has('notify')}>
              <form action={saveNotify} className="aform aform--grid">
                <F label="E-mail de l’équipe (nouvelles demandes, messages)" full>
                  <input name="staffEmail" type="email" defaultValue={notify.staffEmail ?? env.staffEmail ?? ''} />
                </F>
                <label className="acheck">
                  <input type="checkbox" name="sound" defaultChecked={notify.sound} /> Carillon court dans la gestion à l’arrivée d’une demande ou d’un message
                </label>
                <Submit>Enregistrer</Submit>
              </form>
              <p className="amuted">
                Le son est joué une seule fois, jamais en boucle. Sur téléphone ou tablette, utilisez « Activer les notifications » en bas du menu
                {pushEnabled() ? ' : les notifications arrivent même gestion fermée.' : ' (pour les recevoir gestion fermée : ajoutez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY).'}
              </p>
            </Section>

            <Section id="equipe" title="Équipe">
              <div className="atable-wrap">
                <table className="atable">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>E-mail</th>
                      <th>Rôle</th>
                      <th>Dernière connexion</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={u.active ? undefined : 'aoff'}>
                        <td className="strong">{u.name}</td>
                        <td>{u.email}</td>
                        <td>{roleLabel[u.role]}</td>
                        <td className="amuted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                        <td>
                          {u.id !== user.id && (u.role === 'STAFF' || hasRole(user, 'SUPER_ADMIN')) && (
                            <div className="arow-actions">
                              <form action={userUpdate}>
                                <input type="hidden" name="id" value={u.id} />
                                <input type="hidden" name="op" value="toggle" />
                                <Submit className="abtn abtn--ghost abtn--sm">{u.active ? 'Désactiver' : 'Réactiver'}</Submit>
                              </form>
                              <form action={userUpdate}>
                                <input type="hidden" name="id" value={u.id} />
                                <input type="hidden" name="op" value="revoke" />
                                <Submit className="abtn abtn--ghost abtn--sm" title="Déconnecte tous ses appareils">
                                  Déconnecter
                                </Submit>
                              </form>
                              <form action={userUpdate} className="arow-actions">
                                <input type="hidden" name="id" value={u.id} />
                                <input type="hidden" name="op" value="password" />
                                <input type="password" name="password" placeholder="Nouveau mot de passe" minLength={10} required aria-label="Nouveau mot de passe" style={{ width: 180 }} />
                                <Submit className="abtn abtn--ghost abtn--sm">Changer</Submit>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form action={userCreate} className="aform aform--grid">
                <F label="Nom">
                  <input name="name" required maxLength={80} />
                </F>
                <F label="E-mail">
                  <input name="email" type="email" required />
                </F>
                <F label="Mot de passe (10 caractères min.)">
                  <input name="password" type="password" minLength={10} required autoComplete="new-password" />
                </F>
                <F label="Rôle">
                  <select name="role" defaultValue="STAFF">
                    <option value="STAFF">Équipe — demandes, planning, clients, messages</option>
                    {hasRole(user, 'SUPER_ADMIN') && <option value="ADMIN">Administrateur — + galerie et paramètres</option>}
                    {hasRole(user, 'SUPER_ADMIN') && <option value="SUPER_ADMIN">Super administrateur — + gestion des administrateurs</option>}
                  </select>
                </F>
                <Submit>Créer le compte</Submit>
              </form>
            </Section>

            <Section id="integrations" title="Intégrations">
              <ul className="atodo">
                {[
                  ['Base de données permanente', !!env.databaseUrl, 'DATABASE_URL (Neon via Vercel → Storage)'],
                  ['Envoi d’e-mails (Resend)', !!env.resendKey, 'RESEND_API_KEY + EMAIL_FROM'],
                  ['Notifications push', pushEnabled(), 'VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY'],
                ].map(([label, ok, vars]) => (
                  <li key={String(label)}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px 0', borderBottom: '1px solid #f0e9df' }}>
                      <span>
                        {label} <span className="amuted">· {vars}</span>
                      </span>
                      <span className={ok ? 'abadge abadge--live' : 'abadge abadge--off'}>{ok ? 'Configuré' : 'Non configuré'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}

        <Section id="compte" title="Mon mot de passe">
          <form action={passwordChange} className="aform aform--grid">
            <F label="Mot de passe actuel">
              <input type="password" name="current" required autoComplete="current-password" />
            </F>
            <F label="Nouveau mot de passe (10 caractères min.)">
              <input type="password" name="password" minLength={10} required autoComplete="new-password" />
            </F>
            <Submit>Modifier</Submit>
          </form>
        </Section>
      </div>
    </>
  );
}
