import React, { useEffect, useState } from 'react';
import { ShoppingBag, Star, QrCode, CheckCircle, ExternalLink, X, Truck, Zap } from 'lucide-react';
import { SpatialItem } from './SpatialDpadNav';

export interface ProductSpotlightData {
  product_id: string;
  asin: string;
  title: string;
  brand: string;
  price: string;
  prime_badge: boolean;
  rating: number;
  review_count: number;
  detected_in_frame: string;
  scene_timestamp: string;
  delivery_promise: string;
  checkout_url: string;
}

interface AmazonShopCardProps {
  product: ProductSpotlightData | null;
  onDismiss: () => void;
  onAddToCart?: (asin: string) => void;
}

export const AmazonShopCard: React.FC<AmazonShopCardProps> = ({
  product,
  onDismiss,
  onAddToCart
}) => {
  const [addedToCart, setAddedToCart] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(16);

  useEffect(() => {
    if (!product) return;
    setAddedToCart(false);
    setSecondsRemaining(16);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [product, onDismiss]);

  if (!product) return null;

  const handleAdd = () => {
    setAddedToCart(true);
    onAddToCart?.(product.asin);
  };

  return (
    <div className="absolute bottom-28 left-10 z-35 w-[460px] animate-slide-in-right">
      <div className="bg-firetv-card/95 backdrop-blur-xl border-2 border-firetv-amber/60 rounded-2xl p-5 shadow-2xl flex flex-col space-y-3.5">
        {/* Amazon Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="px-2 py-0.5 rounded bg-firetv-amber text-black font-black text-xs tracking-tight">
              amazon
            </div>
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1">
              <span>Prime In-Stream Shopping</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            Auto-dismiss: {secondsRemaining}s
          </span>
        </div>

        {/* Detected Context & Title */}
        <div>
          <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-firetv-cyan bg-firetv-cyan/15 px-2 py-0.5 rounded-md mb-1.5">
            <Zap className="w-3 h-3" />
            <span>AI Detected: {product.detected_in_frame}</span>
          </div>
          <h4 className="text-base font-bold text-white tracking-tight leading-snug">
            {product.title}
          </h4>
          <span className="text-xs text-gray-400">{product.brand}</span>
        </div>

        {/* Pricing, Prime Badge & Ratings */}
        <div className="flex items-center justify-between bg-firetv-dark/60 p-3 rounded-xl border border-gray-800">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-white">{product.price}</span>
              {product.prime_badge && (
                <span className="text-xs font-black text-firetv-cyan bg-firetv-cyan/15 px-2 py-0.5 rounded italic">
                  prime
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-gray-400 mt-1">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{product.delivery_promise}</span>
            </div>
          </div>

          {/* Dynamic Checkout QR Code */}
          <div className="flex flex-col items-center bg-white p-1.5 rounded-lg shrink-0">
            {/* SVG Synthetic QR Code for 1-Tap Mobile Scan */}
            <svg width="56" height="56" viewBox="0 0 56 56" className="text-black">
              <rect width="56" height="56" fill="white" />
              {/* Corner 1 */}
              <rect x="4" y="4" width="16" height="16" fill="black" />
              <rect x="7" y="7" width="10" height="10" fill="white" />
              <rect x="9" y="9" width="6" height="6" fill="black" />
              {/* Corner 2 */}
              <rect x="36" y="4" width="16" height="16" fill="black" />
              <rect x="39" y="7" width="10" height="10" fill="white" />
              <rect x="41" y="9" width="6" height="6" fill="black" />
              {/* Corner 3 */}
              <rect x="4" y="36" width="16" height="16" fill="black" />
              <rect x="7" y="39" width="10" height="10" fill="white" />
              <rect x="9" y="41" width="6" height="6" fill="black" />
              {/* Data Matrix Dots */}
              <rect x="24" y="6" width="4" height="4" fill="black" />
              <rect x="28" y="14" width="4" height="4" fill="black" />
              <rect x="24" y="24" width="8" height="8" fill="#FF9900" />
              <rect x="36" y="28" width="6" height="4" fill="black" />
              <rect x="44" y="36" width="4" height="8" fill="black" />
              <rect x="24" y="44" width="8" height="4" fill="black" />
              <rect x="36" y="44" width="6" height="6" fill="black" />
            </svg>
            <span className="text-[8px] font-mono text-gray-700 font-bold mt-0.5">Scan to Buy</span>
          </div>
        </div>

        {/* 10-Foot Focusable Action Buttons */}
        <div className="flex items-center space-x-3 pt-1">
          <SpatialItem
            id="btn-amazon-add-cart"
            right="btn-amazon-dismiss"
            onSelect={handleAdd}
            accent="amber"
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-firetv-amber to-amber-600 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg"
          >
            {addedToCart ? <CheckCircle className="w-4 h-4 text-black" /> : <ShoppingBag className="w-4 h-4 text-black" />}
            <span>{addedToCart ? "Added to Amazon Cart!" : "Press (Enter) Add to Cart"}</span>
          </SpatialItem>

          <SpatialItem
            id="btn-amazon-dismiss"
            left="btn-amazon-add-cart"
            onSelect={onDismiss}
            accent="cyan"
            className="py-2.5 px-4 bg-firetv-cardBorder/80 border border-gray-700 text-gray-300 font-bold text-xs rounded-xl flex items-center justify-center"
          >
            <span>Dismiss (Back)</span>
          </SpatialItem>
        </div>
      </div>
    </div>
  );
};
