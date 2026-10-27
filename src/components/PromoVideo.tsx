import { useEffect, useRef, useState, type Ref } from 'react';

// Video de presentación (vertical, 57 s). Se descarga solo cuando alguien lo
// reproduce: preload="none" y una imagen de portada liviana.
const SRC = '/video/vozlaboral-presentacion.mp4';
const POSTER = '/video/vozlaboral-presentacion.jpg';
const CAPTIONS = '/video/vozlaboral-presentacion.es.vtt';
export const promoDuration = '1 min';

function PlayIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function Player({ autoPlay, className = '', videoRef }: { autoPlay?: boolean; className?: string; videoRef?: Ref<HTMLVideoElement> }) {
  return (
    <video
      ref={videoRef}
      className={`block aspect-[9/16] w-full bg-ink object-cover ${className}`}
      src={SRC}
      poster={POSTER}
      preload="none"
      controls
      playsInline
      autoPlay={autoPlay}
    >
      <track kind="captions" src={CAPTIONS} srcLang="es" label="Español" />
      Tu navegador no puede reproducir este video.
    </video>
  );
}

/** Reproductor en una ventana: se abre solo cuando la persona lo pide. */
function VideoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal?.();
    if (!open && el.open) el.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Video: cómo funciona VozLaboral"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="m-auto w-[min(26rem,calc(100vw-2rem),calc((100dvh-6rem)*9/16))] overflow-visible bg-transparent p-0 backdrop:bg-ink/85"
    >
      {open && (
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-12 right-0 flex min-h-[44px] items-center gap-2 rounded px-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Cerrar <span aria-hidden="true">✕</span>
          </button>
          <Player autoPlay className="rounded-lg shadow-2xl" />
        </div>
      )}
    </dialog>
  );
}

/** Tarjeta de la portada: miniatura y botón que abre el video. */
export function PromoVideoTeaser({ className = 'mt-6' }: { className?: string }) {
  const [open, setOpen] = useState(false);

  // En el celular, el botón «atrás» cierra el video en lugar de salir de la página:
  // al abrir se añade una entrada al historial y al cerrar se retira.
  useEffect(() => {
    const onPop = () => setOpen(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const show = () => {
    history.pushState({ ...history.state, vlVideo: true }, '');
    setOpen(true);
  };
  const hide = () => {
    if (history.state?.vlVideo) history.back();
    else setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={`group flex w-full max-w-[36rem] ${className} items-center gap-4 rounded-md border border-white/20 bg-white/[0.06] p-2.5 pr-5 text-left transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
      >
        <span className="relative block w-[4.5rem] flex-none overflow-hidden rounded">
          <img src={POSTER} alt="" width={72} height={128} loading="lazy" className="block aspect-[9/16] w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow transition-transform group-hover:scale-110">
              <PlayIcon className="ml-0.5 h-5 w-5" />
            </span>
          </span>
        </span>
        <span>
          <span className="block font-semibold text-white">Mira cómo funciona</span>
          <span className="mt-0.5 block text-sm text-white/75">
            Video de {promoDuration}, con sonido y subtítulos: qué es VozLaboral y qué puedes hacer.
          </span>
        </span>
      </button>
      <VideoDialog open={open} onClose={hide} />
    </>
  );
}

/** Video dentro de la página, para «Cómo funciona». */
export function PromoVideoInline() {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  return (
    <div className="relative mx-auto w-full max-w-[20rem] overflow-hidden rounded-lg border border-line shadow-lg">
      <Player videoRef={ref} />
      {!started && (
        <button
          type="button"
          onClick={() => {
            setStarted(true);
            void ref.current?.play();
          }}
          className="group absolute inset-0 flex flex-col items-center justify-end gap-3 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent pb-8 text-white focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform group-hover:scale-110">
            <PlayIcon className="ml-1 h-8 w-8" />
          </span>
          <span className="font-semibold">Ver el video · {promoDuration}</span>
        </button>
      )}
    </div>
  );
}
