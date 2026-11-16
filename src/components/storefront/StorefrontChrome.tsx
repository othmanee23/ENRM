import type { ReactNode } from 'react';
import { CartCount } from './CartCount';
import { MobileMenu } from './StorefrontControls';
import { AdviceMiniForm } from './AdviceMiniForm';

export function StorefrontChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">
        Aller au contenu
      </a>
      <div className="demo-bar">
        ENRM · LE MOUVEMENT COMMENCE ICI <span>Prix indicatifs · disponibilité à confirmer</span>
      </div>
      <header>
        <a className="brand-home" href="/" aria-label="ENRM accueil">
          <img
            className="logo logo-dark"
            src="/assets/logo.svg"
            alt="ENRM Solutions & Services"
            width="151"
            height="45"
          />
          <img
            className="logo logo-light"
            src="/assets/logo-light.svg"
            alt=""
            aria-hidden="true"
            width="151"
            height="45"
          />
        </a>
        <nav aria-label="Navigation principale">
          <a href="/catalogue">Les huiles</a>
          <a href="/#marques">Les marques</a>
          <a href="/conseil">Le conseil</a>
          <a href="/a-propos">ENRM</a>
        </nav>
        <div className="header-actions">
          <a className="search-link" href="/catalogue#search" aria-label="Rechercher une huile">
            ⌕
          </a>
          <a className="cart-button" href="/panier" aria-label="Ouvrir le panier">
            Panier{' '}
            <span id="cart-count">
              <CartCount />
            </span>
          </a>
          <MobileMenu />
        </div>
      </header>
      {children}
      <section className="advice-studio section motion-scene" id="conseil">
        <div className="advice-studio-heading">
          <h2>
            Le bon choix
            <br />
            commence <em>ici.</em>
          </h2>
        </div>
        <div className="advice-studio-form">
          <h3>
            Faisons connaissance
            <br />
            avec votre moteur.
          </h3>
          <AdviceMiniForm />
        </div>
      </section>
      <footer className="footer-v5" id="footer">
        <div className="footer-directory">
          <div className="footer-column">
            <h2>Les huiles</h2>
            <a href="/catalogue">Le catalogue</a>
            <a href="/catalogue?volume=5+L">Formats du quotidien</a>
            <a href="/catalogue?volume=20+L">Pour les ateliers</a>
            <a href="/#marques">Les marques</a>
          </div>
          <div className="footer-column">
            <h2>Vous accompagner</h2>
            <a href="/conseil">Trouver mon huile</a>
            <a href="/contact">Nous contacter</a>
            <a href="/livraison">Livraison</a>
            <a href="/retours">Retours & conditions</a>
          </div>
          <div className="footer-column">
            <h2>ENRM</h2>
            <a href="/a-propos">À propos</a>
            <a href="/confidentialite">Confidentialité</a>
            <a href="/credits">Crédits</a>
          </div>
          <div className="footer-column footer-actions">
            <a href="/conseil" className="footer-pill">
              Un conseil <span>↗</span>
            </a>
            <a href="/catalogue" className="footer-pill outline-pill">
              Explorer les huiles <span>↗</span>
            </a>
            <a className="footer-return" href="#main" aria-label="Revenir en haut de la page">
              ↑
            </a>
          </div>
        </div>
        <div className="footer-signature-row">
          <a className="footer-signature" href="/" aria-label="ENRM accueil">
            <img src="/assets/logo-wordmark-light.svg" alt="ENRM" width="792" height="169" />
          </a>
          <div className="footer-legal">
            <span>Maroc · Français</span>
            <p>
              Demande de commande
              <br />
              Prix indicatifs · conditions à confirmer
            </p>
            <span>© 2026 ENRM</span>
          </div>
        </div>
      </footer>
    </>
  );
}
