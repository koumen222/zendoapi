import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Z</span>
              </div>
              <span className="text-xl font-bold text-white">Zendo</span>
            </div>
            <p className="text-sm text-gray-400">
              Votre destination pour des produits de beauté et bien-être naturels. Paiement à la livraison disponible.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/catalogue" className="hover:text-primary-400 transition-colors">
                  Catalogue
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-primary-400 transition-colors cursor-pointer">
                À propos de Zendo
              </li>
              <li className="hover:text-primary-400 transition-colors cursor-pointer">
                Conseils beauté
              </li>
              <li className="hover:text-primary-400 transition-colors cursor-pointer">
                Livraison & Retours
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: contact@zendo.site</li>
              <li>Téléphone: +225 XX XX XX XX XX</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Zendo. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
