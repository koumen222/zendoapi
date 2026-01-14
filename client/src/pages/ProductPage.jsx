import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CODForm from '../components/CODForm';

function ProductPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);

  // Fonction pour scroller vers le formulaire avec effet visuel
  const scrollToForm = () => {
    const formElement = document.getElementById('order-form');
    if (formElement) {
      const headerOffset = 80; // Offset pour le header
      const elementPosition = formElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Effet visuel : highlight du formulaire
      setTimeout(() => {
        formElement.classList.add('ring-4', 'ring-primary-400', 'ring-opacity-50');
        setTimeout(() => {
          formElement.classList.remove('ring-4', 'ring-primary-400', 'ring-opacity-50');
        }, 2000);
      }, 500);
    }
  };

  useEffect(() => {
    // Données hardcodées pour Hismile uniquement
    setProductData({
      name: 'Hismile™ – Le Sérum Qui Blanchis tes dents dès le premier jour',
      price: 'Prix sur demande',
      images: [],
      description: '',
      shortDesc: 'Sérum correcteur de teinte pour les dents. Effet instantané, sans peroxyde.',
      benefits: [],
      usage: '',
      deliveryInfo: '',
      reviews: [],
      stock: 'En stock',
      rating: 4.8,
      reviewCount: 252,
      sections: [],
      faq: [],
      whyItWorks: null,
      guarantee: 'Il est recommandé par les dentistes du Cameroun et du monde entier.',
    });
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-primary-600 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Bannière Cameroun */}
      <section className="bg-primary-600 text-white py-3 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-3">
            <img
              src="https://flagcdn.com/w160/cm.png"
              alt="Cameroun"
              className="w-8 h-6 object-cover rounded"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.target.style.display = 'none';
              }}
            />
            <span className="font-semibold text-sm md:text-base">
              Disponible partout au Cameroun
            </span>
            <img
              src="https://flagcdn.com/w160/cm.png"
              alt="Cameroun"
              className="w-8 h-6 object-cover rounded"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </section>

      {/* Images - Collées au header */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/ChatGPT Image 13 janv. 2026, 17_11_57.png"
            alt={productData?.name || 'Produit Zendo'}
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>
      
      {/* Deuxième image */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/ChatGPT Image 13 janv. 2026, 17_25_05.png"
            alt={productData?.name || 'Produit Zendo'}
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>
      
      {/* Troisième image */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/ChatGPT Image 13 janv. 2026, 17_38_17.png"
            alt={productData?.name || 'Produit Zendo'}
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>
      
      {/* Quatrième image */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/bf.png"
            alt={productData?.name || 'Produit Zendo'}
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>
      
      {/* Cinquième image - Avis clients */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/e4c87fd5-acaf-4a1c-9170-4fcb392af042.png"
            alt="Avis clients Zendo"
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>
      
      {/* Sixième image - Offres */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/7563d5bf-b451-4ef9-97c3-b969f41d17e5.png"
            alt="Offres exclusives Zendo"
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>

      {/* Image recommandation experte */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/681a01b9-c2cd-4eba-84b0-3a81622c0afc.png"
            alt="Recommandation experte dentaire"
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>

      {/* CTA Section - Order Form */}
      <section id="order" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div id="order-form" className="p-8 md:p-12 rounded-2xl" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
              <CODForm productSlug={slug} />
            </div>
          </div>
        </div>
      </section>

      {/* Image en bas */}
      <div className="relative w-full max-w-4xl mx-auto bg-white">
          <img
            src="/images/ChatGPT Image 13 janv. 2026, 17_36_08.png"
            alt="Avantages Zendo"
            className="w-full h-auto object-top"
            style={{
              width: '100%',
              maxWidth: '1080px',
              objectFit: 'cover',
              objectPosition: 'top',
              margin: '0 auto',
              display: 'block',
            }}
          />
      </div>

      {/* Bouton flottant Commander */}
      <button
        onClick={scrollToForm}
        className="fixed bottom-4 right-4 bg-primary-600 text-white px-6 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-primary-700 transition-all duration-300 z-50 animate-bounce hover:scale-110"
        style={{
          boxShadow: '0 10px 25px rgba(107, 33, 168, 0.4)',
          animation: 'bounce 2s infinite',
        }}
      >
        Commander
      </button>
    </div>
  );
}

export default ProductPage;
