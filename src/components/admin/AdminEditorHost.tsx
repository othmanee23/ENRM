'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type EditorRequest = { title: string; content: ReactNode | string };

export function AdminEditorHost() {
  const [editor, setEditor] = useState<EditorRequest | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const request = (event as CustomEvent<EditorRequest>).detail;
      setEditor(request);
    };
    window.addEventListener('enrm-admin-open-editor', onOpen);
    return () => window.removeEventListener('enrm-admin-open-editor', onOpen);
  }, []);

  useEffect(() => {
    if (editor && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [editor]);

  return (
    <dialog id="editor" aria-labelledby="dialog-title" ref={dialogRef}>
      <div className="dialog-head">
        <div>
          <small id="dialog-kicker">ENRM GESTION</small>
          <h2 id="dialog-title">{editor?.title}</h2>
        </div>
        <button
          className="icon-button"
          id="close-dialog"
          aria-label="Fermer"
          type="button"
          onClick={() => dialogRef.current?.close()}
        >
          ✕
        </button>
      </div>
      <div id="dialog-content">{editor?.content}</div>
    </dialog>
  );
}
