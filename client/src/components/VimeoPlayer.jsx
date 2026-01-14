import { useEffect, useRef, useState } from 'react';

function VimeoPlayer({ videoId, className = '' }) {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Extraire l'ID de la vidéo depuis l'URL
    const extractVideoId = (url) => {
      const match = url.match(/vimeo\.com\/(\d+)/);
      return match ? match[1] : null;
    };

    const id = typeof videoId === 'string' && videoId.includes('vimeo.com') 
      ? extractVideoId(videoId) 
      : videoId;

    if (!id || !containerRef.current) return;

    // Créer l'iframe Vimeo avec tous les contrôles masqués et autoplay avec son
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&loop=1&muted=0&playsinline=1&controls=0&title=0&byline=0&portrait=0&background=1&transparent=1&responsive=1`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '0';
    iframe.loading = 'lazy';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('webkitallowfullscreen', 'true');
    iframe.setAttribute('mozallowfullscreen', 'true');

    iframe.onload = () => {
      setIsLoaded(true);
    };

    containerRef.current.appendChild(iframe);

    return () => {
      if (containerRef.current && containerRef.current.contains(iframe)) {
        containerRef.current.removeChild(iframe);
      }
    };
  }, [videoId]);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="relative w-full bg-black overflow-hidden shadow-2xl mx-auto"
        style={{
          width: '100%',
          maxWidth: '1080px',
          aspectRatio: '1080/1150',
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: '0',
        }}
      >
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{
            width: '120%',
            height: '120%',
            left: '-10%',
            top: '-10%',
            transform: 'scale(1.1)',
            transformOrigin: 'center center',
          }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-sm">Chargement de la vidéo...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Overlay pour masquer complètement les contrôles Vimeo */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'transparent',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default VimeoPlayer;
