"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useState, useEffect, useCallback } from 'react';
import { Leaf, TreePine, Coins, TrendingUp, Shield, Users, Wallet, CheckCircle, ArrowRight, Star, Award, Globe, ChevronDown } from 'lucide-react';
import { useAccount } from "wagmi";
// import { Address } from "/components/scaffold-eth";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Types and Interfaces
interface TreeType {
  id: string;
  name: string;
  emoji: string;
  initialCost: string;
  yieldYears: string;
  annualReturn: string;
  description: string;
  featured?: boolean;
}

interface StepInfo {
  icon: typeof Coins;
  title: string;
  description: string;
  step: number;
}

interface BenefitInfo {
  icon: typeof Shield;
  title: string;
  description: string;
  stat?: string;
}

// Constants
const ANIMATION_CONFIG = {
  HERO_DELAY: 0.5,
  HERO_DURATION: 1,
  HERO_STAGGER: 0.2,
  SCROLL_TRIGGER_START: "top 80%",
  SCROLL_TRIGGER_END: "bottom 20%",
  CARD_HOVER_SCALE: 1.02,
  BUTTON_HOVER_SCALE: 1.05
} as const;


const HOW_IT_WORKS_STEPS: StepInfo[] = [
  {
    icon: Wallet,
    title: "Connect & Fund",
    description: "Connect your wallet and choose your investment amount from our curated tree portfolio",
    step: 1
  },
  {
    icon: TreePine,
    title: "Watch Growth",
    description: "Monitor your tree's development through our real-time dashboard with NFT value tracking",
    step: 2
  },
  {
    icon: TrendingUp,
    title: "Earn Yields",
    description: "Receive automated annual returns directly to your wallet when trees begin producing",
    step: 3
  },
  {
    icon: Coins,
    title: "Reinvest or Withdraw",
    description: "Scale your portfolio by reinvesting returns or withdraw profits at any time",
    step: 4
  }
];

const BENEFITS: BenefitInfo[] = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Multi-signature smart contracts audited by leading security firms",
    stat: "99.9% Uptime"
  },
  {
    icon: Globe,
    title: "Global Accessibility",
    description: "Invest from anywhere in the world with 24/7 blockchain availability",
    stat: "50+ Countries"
  },
  {
    icon: Award,
    title: "Proven Returns",
    description: "Historical performance showing consistent yields above traditional investments",
    stat: "22% Avg Return"
  }
];

// Custom Hooks
const useAnimations = () => {
  useEffect(() => {
    // Hero animations with stagger
    const heroElements = [".hero-badge", ".hero-title", ".hero-description", ".hero-buttons", ".hero-stats"];
    
    gsap.fromTo(heroElements, 
      { y: 60, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: ANIMATION_CONFIG.HERO_DURATION,
        stagger: ANIMATION_CONFIG.HERO_STAGGER,
        delay: ANIMATION_CONFIG.HERO_DELAY,
        ease: "power3.out"
      }
    );

    // Scroll animations for sections
    gsap.utils.toArray([".animate-on-scroll"]).forEach((element: any) => {
      gsap.fromTo(element,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: ANIMATION_CONFIG.SCROLL_TRIGGER_START,
            end: ANIMATION_CONFIG.SCROLL_TRIGGER_END,
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Card hover animations
    gsap.utils.toArray([".hover-card"]).forEach((card: any) => {
      const tl = gsap.timeline({ paused: true });
      tl.to(card, { scale: ANIMATION_CONFIG.CARD_HOVER_SCALE, duration: 0.3, ease: "power2.out" });
      
      card.addEventListener('mouseenter', () => tl.play());
      card.addEventListener('mouseleave', () => tl.reverse());
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
};

const useMountedState = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  return isMounted;
};

// Component
const Landing: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [selectedTree, setSelectedTree] = useState<TreeType | null>(null);
  const isMounted = useMountedState();

  useAnimations();

  const handleStartInvesting = useCallback(() => {
    if (!isConnected || !isMounted) return;
    console.log('Starting investment flow');
  }, [isConnected, isMounted]);

  const handleLearnMore = useCallback(() => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="hero-badge opacity-0 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              Trusted by 999+ eco-investors worldwide
            </div>

            {/* Title */}
            <h1 className="hero-title opacity-0 text-5xl md:text-7xl font-bold text-slate-800 mb-6 leading-tight">
              Sustainable Wealth
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Through Nature
              </span>
            </h1>

            {/* Description */}
            <p className="hero-description opacity-0 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
              Invest in blockchain-verified virtual trees and earn consistent returns while contributing 
              to environmental sustainability. Join the future of green finance.
            </p>

            {/* Buttons */}
            <div className="hero-buttons opacity-0 flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                className={`group px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  !isMounted || !isConnected
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
                disabled={!isMounted || !isConnected}
                onClick={handleStartInvesting}
              >
                {!isMounted ? 'Loading...' : isConnected ? 'Start Investing' : 'Connect Wallet First'}
                {isMounted && isConnected && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              <button
                className="px-8 py-4 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-800 rounded-xl text-lg font-semibold transition-all duration-300 hover:bg-slate-50"
                onClick={handleLearnMore}
              >
                Learn More
                <ChevronDown className="w-5 h-5 inline-block ml-2" />
              </button>
            </div>

            {/* Stats */}
            <div className="hero-stats opacity-0 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { value: '999 tBNB+', label: 'Total Invested' },
                { value: '69+', label: 'Trees Planted' },
                { value: '22%', label: 'Avg. Annual Return' },
                { value: '98.5%', label: 'Success Rate' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tree Portfolio Preview */}
      

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-on-scroll text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Simple, Transparent Process
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get started with sustainable investing in just four easy steps
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS_STEPS.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={index} className="animate-on-scroll text-center relative">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-slate-800 mb-3">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;