'use client';

import { useEffect } from 'react';
import { AdminNavigation } from './AdminNavigation';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminProductsPanel } from './AdminProductsPanel';
import { AdminCustomersPanel } from './AdminCustomersPanel';

export function AdminWorkspace() {
  useEffect(() => {
    if (!window.location.hash) window.location.hash = 'categories';
    void import('../../admin/main');
  }, []);

  return (
    <>
      <a className="skip" href="#workspace">
        Aller au contenu
      </a>
      <aside className="sidebar" id="sidebar">
        <a href="/admin" className="admin-brand">
          <img src="/assets/logo-light.svg" alt="ENRM" />
          <span>ESPACE DE GESTION</span>
        </a>
        <div className="store-switch">
          <span className="store-icon">E</span>
          <div>
            <strong>ENRM Maroc</strong>
            <small id="store-label">Chargement de la boutique…</small>
          </div>
          <span className="live-dot" />
        </div>
        <p className="nav-caption" id="nav-caption">
          VOTRE ACTIVITÉ
        </p>
        <nav id="admin-nav" aria-label="Navigation administration">
          <AdminNavigation />
        </nav>
        <div className="sidebar-bottom">
          <a href="/" className="store-link">
            <span>↗</span> Voir la boutique
          </a>
          <div className="profile">
            <span className="avatar">EA</span>
            <div>
              <strong id="profile-name">Espace ENRM</strong>
              <small id="profile-role">Chargement…</small>
            </div>
          </div>
          <button className="text-action" id="admin-signout" type="button" hidden>
            Se déconnecter
          </button>
        </div>
      </aside>
      <button className="sidebar-scrim" id="scrim" aria-label="Fermer le menu" hidden />
      <div className="app-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            id="mobile-menu"
            aria-label="Ouvrir le menu"
            aria-controls="sidebar"
            aria-expanded="false"
          >
            ☰
          </button>
          <div className="breadcrumb">
            Espace de gestion <span>/</span> <strong id="crumb">Vue d’ensemble</strong>
          </div>
          <form className="global-search" id="global-search" role="search">
            <span id="search-icon" />
            <input
              id="global-query"
              aria-label="Rechercher partout"
              placeholder="Rechercher partout…"
              autoComplete="off"
            />
            <kbd>⌘ K</kbd>
          </form>
          <span className="demo-tag" id="environment-tag">
            <i /> Chargement…
          </span>
          <button className="icon-button" id="notifications" aria-label="Voir les alertes" />
          <span className="avatar top-avatar">EA</span>
        </header>
        <AdminOrdersPanel />
        <AdminProductsPanel />
        <AdminCustomersPanel />
        <main id="workspace" tabIndex={-1}>
          <div className="loading">Chargement des données ENRM…</div>
        </main>
        <footer className="admin-foot">
          <span>ENRM · Votre activité, en toute clarté.</span>
          <span id="admin-footer-note">Connexion à Supabase…</span>
        </footer>
      </div>
      <dialog id="editor" aria-labelledby="dialog-title">
        <div className="dialog-head">
          <div>
            <small id="dialog-kicker">ENRM GESTION</small>
            <h2 id="dialog-title" />
          </div>
          <button className="icon-button" id="close-dialog" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div id="dialog-content" />
      </dialog>
      <div role="status" className="toast" id="admin-toast" />
    </>
  );
}
