import Image from 'next/image';
import { redirect } from 'next/navigation';
import { media } from '@/data/media';
import { currentUser } from '@/lib/auth/session';
import { canSignSessions, env } from '@/lib/env';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Connexion' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (canSignSessions() && (await currentUser().catch(() => null))) redirect('/admin');
  return (
    <div className="alogin">
      <div className="alogin-visual">
        <Image src={media.vitrineEclairs.src} alt="" fill sizes="55vw" priority />
      </div>
      <div className="alogin-side">
        <div className="alogin-card">
          <p className="alogin-brand">
            Le Duo <em>d’Artisans</em>
            <small>Gestion de la boutique</small>
          </p>
          {!canSignSessions() && <p className="aerr">Aucune base de données n’est connectée : la connexion est impossible. Connectez Neon dans Vercel (Storage), puis redéployez.</p>}
          <LoginForm />
          {!env.isProd && !env.adminEmail && (
            <p className="alogin-dev">
              Développement local : <b>admin@duo.local</b> / <b>boulangerie-dev</b>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
