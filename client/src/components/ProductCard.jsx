import { Link } from 'react-router-dom';
import { getFirstWord } from '../utils/format';

function ProductCard({ product }) {
  const imageUrl =
    product.productImages && product.productImages.length > 0
      ? product.productImages[0]
      : null;

  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-64 bg-gray-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">Image non disponible</span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {getFirstWord(product.name)}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary-600">
            {product.price || 'Prix sur demande'}
          </span>
          <span className="text-primary-600 group-hover:translate-x-1 transition-transform inline-block">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
