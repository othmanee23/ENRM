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
          <a href="/">Accueil</a>
          <a href="/catalogue">Produits</a>
          <a href="/a-propos">À propos</a>
          <a href="/blogs">Blogs</a>
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
          <a
            className="contact-whatsapp-icon"
            href="https://wa.me/212661428406"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contacter ENRM sur WhatsApp au +212 6 61 42 84 06"
            title="Contacter ENRM sur WhatsApp"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12.04 2a9.84 9.84 0 0 0-8.45 14.9L2.3 22l5.22-1.37A9.92 9.92 0 1 0 12.04 2Zm0 18.03a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.1.81.83-3.02-.2-.31a8.13 8.13 0 1 1 6.9 3.83Zm4.46-6.09c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.32-.74-1.8-.2-.47-.4-.41-.54-.42l-.46-.01c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.4-.58 1.6-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
            </svg>
          </a>
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
            <a href="/blogs">Conseils et guides</a>
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
