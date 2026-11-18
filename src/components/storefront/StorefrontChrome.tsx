import type { ReactNode } from 'react';
import { CartCount } from './CartCount';
import { MobileMenu } from './StorefrontControls';
import { ContactForm } from './ContactForm';

export function StorefrontChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">
        Aller au contenu
      </a>
      <div className="demo-bar">
        ENRM — LE MOUVEMENT COMMENCE ICI{' '}
        <span>Livraison gratuite à Rabat et dès 1 000 MAD de commande.</span>
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
          <a href="/a-propos">À propos</a>
          <a href="/contact">Contact</a>
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
      <section className="advice-studio section motion-scene" id="site-contact">
        <div className="advice-studio-heading">
          <h2>
            Parlons
            <br />
            de votre <em>besoin.</em>
          </h2>
          <p>
            Une question sur une huile, une référence ou une commande&nbsp;? Notre équipe est à
            votre écoute.
          </p>
        </div>
        <div className="advice-studio-form">
          <h3>Envoyez-nous votre message</h3>
          <ContactForm />
          <a className="contact-call-cta" href="tel:+212661428406">
            +212 6 61 42 84 06 · Appeler
          </a>
          <a href="https://wa.me/212661428406">Écrire sur WhatsApp ↗</a>
          <p>Tous les jours · 9h–22h</p>
        </div>
      </section>
      <footer className="footer-v5" id="footer">
        <div className="footer-directory">
          <div className="footer-column">
            <h2>Les huiles</h2>
            <a href="/catalogue">Le catalogue</a>
            <a href="/#marques">Les marques</a>
            <a href="/catalogue?viscosity=5W-30&volume=5+L">Huiles moteur 5W-30</a>
            <a href="/catalogue?viscosity=5W-40&volume=5+L">Huiles moteur 5W-40</a>
            <a href="/catalogue?volume=20+L">Formats professionnels</a>
          </div>
          <div className="footer-column">
            <h2>Vous accompagner</h2>
            <a href="/conseil">Trouver mon huile</a>
            <a href="/contact">Nous contacter</a>
            <a href="/livraison">Livraison</a>
            <a href="/a-propos">À propos</a>
          </div>
          <div className="footer-column">
            <h2>ENRM</h2>
            <a href="/a-propos">À propos</a>
            <a href="/confidentialite">Confidentialité</a>
            <a href="/credits">Crédits</a>
            <p>Avenue de la Résistance, quartier de l’Océan, Rabat</p>
            <p>ICE : 003702111000048</p>
          </div>
          <div className="footer-column footer-actions">
            <h2>Besoin d’un renseignement&nbsp;?</h2>
            <a href="tel:+212661428406" className="footer-contact-phone">
              +212 6 61 42 84 06 · Appeler
            </a>
            <a href="mailto:Nizarafifi1551@gmail.com">Nizarafifi1551@gmail.com</a>
            <p>Tous les jours · 9h–22h</p>
            <a href="/contact" className="footer-pill">
              Nous contacter <span>↗</span>
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
              ENRM Solutions &amp; Services
              <br />
              Vente, distribution et livraison de lubrifiants automobiles pour particuliers et
              professionnels.
            </p>
            <span>© 2026 ENRM Solutions &amp; Services</span>
          </div>
        </div>
      </footer>
    </>
  );
}
