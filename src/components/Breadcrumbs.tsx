import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useShop } from '../ShopContext';

export default function Breadcrumbs() {
  const location = useLocation();
  const { products } = useShop();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-4 py-2 border-b border-gray-100 bg-white dark:bg-gray-900">
      <ol className="flex items-center space-x-1 text-xs text-gray-500 font-medium uppercase tracking-wider">
        <li>
          <Link to="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          
          let displayName = value.replace(/-/g, ' ');
          let to = `/${pathnames.slice(0, index + 1).join('/')}`;

          if (value === 'product') {
            displayName = 'Shop';
            to = '/shop';
          } else if (index > 0 && pathnames[index - 1] === 'product') {
            const product = products.find(p => p.id === value);
            if (product) displayName = product.name;
          }

          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
              {last ? (
                <span className="text-black dark:text-gray-100 font-black">{displayName}</span>
              ) : (
                <Link to={to} className="hover:text-black dark:hover:text-white transition-colors">{displayName}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
