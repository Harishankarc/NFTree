"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { Leaf, Menu, X } from "lucide-react";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Buy Tree",
    href: "/buytree",
  },
  {
    label: "Profile",
    href: "/profile",
  }
];

export const HeaderMenuLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onLinkClick}
              className={`
                relative px-10 py-3 font-medium text-base transition-all duration-300 group hover:underline hover:underline-offset-6
                ${mobile 
                  ? 'block text-slate-700 hov er:text-emerald-600 hover:bg-emerald-50 rounded-lg' 
                  : `text-slate-700 hover:text-emerald-600 ${isActive ? 'text-emerald-600' : ''}`
                }
              `}
            >
              <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
              </div>
              {/* Active indicator */}
              {isActive && !mobile && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600" />
              )}
              {/* Hover effect */}
              {!mobile && !isActive && (
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 " />
              )}
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-slate-100/50 border-b border-slate-200/50' 
          : 'bg-white/80 backdrop-blur-sm'
        }
      `}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  TreeFi
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex">
              <ul className="flex items-center gap-8">
                <HeaderMenuLinks />
              </ul>
            </nav>

            {/* Right side - Wallet & Faucet */}
            <div className="flex items-center gap-3">
              {isLocalNetwork && (
                <div className="hidden sm:block">
                  <FaucetButton />
                </div>
              )}
              
              <RainbowKitCustomConnectButton />

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`
          lg:hidden transition-all duration-300 overflow-hidden
          ${isMobileMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0'
          }
        `}>
          <div className="border-t border-slate-200/50 bg-white/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <nav>
                <ul className="space-y-1">
                  <HeaderMenuLinks mobile={true} onLinkClick={closeMobileMenu} />
                </ul>
                
                {/* Mobile Faucet Button */}
                {isLocalNetwork && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <FaucetButton />
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
    </>
  );
};