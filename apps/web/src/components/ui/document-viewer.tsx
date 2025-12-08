'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  BookOpen,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  pdfUrl?: string;
  source?: string;
  externalId?: string;
  thumbnailUrl?: string;
  authors?: string[];
}

type ViewerType = 'archive' | 'pdf' | 'google-docs' | 'iframe';

function getViewerType(url: string, source?: string): ViewerType {
  if (source === 'archive_org' || url.includes('archive.org')) {
    return 'archive';
  }
  if (url.endsWith('.pdf') || url.includes('/pdf/') || url.includes('.pdf')) {
    return 'pdf';
  }
  return 'iframe';
}

function getEmbedUrl(url: string, externalId?: string, viewerType?: ViewerType): string {
  // Internet Archive - use their embed stream
  if (viewerType === 'archive' || url.includes('archive.org')) {
    // Extract identifier from URL if not provided
    const identifier = externalId || url.match(/archive\.org\/details\/([^\/\?]+)/)?.[1];
    if (identifier) {
      // Use the BookReader embed
      return `https://archive.org/embed/${identifier}`;
    }
  }

  // PDF files - use Google Docs viewer as fallback for cross-origin PDFs
  if (viewerType === 'pdf' || url.endsWith('.pdf')) {
    // Try direct loading first, but provide Google Docs fallback URL
    return url;
  }

  return url;
}

export function DocumentViewer({
  isOpen,
  onClose,
  title,
  url,
  pdfUrl,
  source,
  externalId,
  thumbnailUrl,
  authors,
}: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const viewerType = getViewerType(pdfUrl || url, source);
  const embedUrl = getEmbedUrl(pdfUrl || url, externalId, viewerType);

  // Google Docs viewer as fallback for PDFs that can't load directly
  const fallbackUrl = viewerType === 'pdf'
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl || url)}&embedded=true`
    : embedUrl;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setUseFallback(false);
    }
  }, [isOpen, url]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    if (!useFallback && viewerType === 'pdf') {
      // Try fallback URL
      setUseFallback(true);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const currentUrl = useFallback ? fallbackUrl : embedUrl;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-secondary-900/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel
              className={cn(
                'flex flex-col bg-white shadow-2xl transition-all duration-300',
                isFullscreen
                  ? 'fixed inset-0'
                  : 'fixed inset-4 sm:inset-6 md:inset-8 lg:inset-12 rounded-2xl overflow-hidden'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-secondary-50 to-secondary-100/50 border-b border-secondary-200/50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {thumbnailUrl && (
                    <img
                      src={thumbnailUrl}
                      alt=""
                      className="w-10 h-12 object-cover rounded-lg shadow-sm hidden sm:block"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-sm font-semibold text-secondary-900 truncate">
                      {title}
                    </Dialog.Title>
                    {authors && authors.length > 0 && (
                      <p className="text-xs text-secondary-500 truncate">
                        {authors.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Source badge */}
                  {source && (
                    <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-secondary-100 text-xs font-medium text-secondary-600">
                      {source === 'archive_org' ? 'Internet Archive' : source}
                    </span>
                  )}

                  {/* Download button */}
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}

                  {/* Open in new tab */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  {/* Fullscreen toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 transition-colors"
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </button>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-secondary-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 relative bg-secondary-100">
                {/* Loading state */}
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary-50 z-10">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <BookOpen className="h-8 w-8 text-white animate-pulse" />
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
                    </div>
                    <p className="mt-6 text-secondary-600 font-medium">Cargando documento...</p>
                    <p className="mt-2 text-secondary-400 text-sm">Esto puede tomar unos segundos</p>
                  </div>
                )}

                {/* Error state */}
                {hasError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary-50 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      No se pudo cargar el documento
                    </h3>
                    <p className="text-secondary-500 text-sm max-w-md text-center mb-6">
                      El documento no está disponible para visualización en línea.
                      Puedes abrirlo en una nueva pestaña o descargarlo.
                    </p>
                    <div className="flex gap-3">
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Abrir en nueva pestaña
                        </Button>
                      </a>
                      {pdfUrl && (
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="gradient">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Iframe viewer */}
                <iframe
                  src={currentUrl}
                  className={cn(
                    'w-full h-full border-0',
                    (isLoading || hasError) && 'invisible'
                  )}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>

              {/* Footer with keyboard hint */}
              <div className="px-4 py-2 bg-secondary-50 border-t border-secondary-200/50 text-center">
                <p className="text-xs text-secondary-400">
                  Presiona <kbd className="px-1.5 py-0.5 bg-secondary-200 rounded text-secondary-600 font-mono">ESC</kbd> para cerrar
                </p>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
