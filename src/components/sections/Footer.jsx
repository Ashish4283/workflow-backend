import React from 'react';
import logoUrl from '@/img/logo.svg';
import { Link } from 'react-router-dom';

const Footer = ({ scrollToSection }) => {
  return (
    <footer className="py-12 bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
            className="flex items-center mb-4 md:mb-0 cursor-pointer"
          >
            <img src={logoUrl} alt="Creative 4 AI Logo" className="h-10 w-auto" />
          </a>

          <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
            <span>© {new Date().getFullYear()} Creative 4 AI</span>
            <span>•</span>
            <Link to="/legal" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/legal" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-slate-600 dark:text-slate-400 italic">
            "In the coming era, humans will have creativity—AI will bring it to life."
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;