import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/sections/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import PortfolioSection from '@/components/sections/PortfolioSection';
import StudioServicesSection from '@/components/sections/StudioServicesSection';
import ContactSection from '@/components/sections/ContactSection';
import Footer from '@/components/sections/Footer';

const Home = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    toast({
      title: `Switched to ${!isDark ? 'dark' : 'light'} mode`,
      description: "Theme updated successfully!",
    });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleContactClick = () => {
    toast({ title: "Let's Connect!", description: "Ready to bring your creative vision to life?" });
    scrollToSection('contact');
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-foreground overflow-x-hidden selection:bg-primary/30">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} scrollToSection={scrollToSection} activeSection={activeSection} />

      <main>
        <HeroSection scrollToSection={scrollToSection} />

        <div className="space-y-32 pb-32">
          <section className="reveal">
            <AboutSection />
          </section>

          <section className="reveal">
            <PortfolioSection />
          </section>

          <section className="reveal">
            <StudioServicesSection scrollToSection={scrollToSection} />
          </section>

          <section className="reveal">
            <ContactSection handleContactClick={handleContactClick} />
          </section>
        </div>
      </main>

      <Footer scrollToSection={scrollToSection} />
    </div>
  );
};

export default Home;