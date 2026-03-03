import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Github, Twitter, Linkedin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const socialLinks = [
  { icon: <Github className="w-5 h-5" />, label: "GitHub", url: "https://github.com" },
  { icon: <Twitter className="w-5 h-5" />, label: "Twitter", url: "https://twitter.com" },
  { icon: <Linkedin className="w-5 h-5" />, label: "LinkedIn", url: "https://www.linkedin.com/in/ashishjiwa" },
  { icon: <FileText className="w-5 h-5" />, label: "Resume", url: "/resume.html" }
];

const ContactSection = ({ handleContactClick, handleViewWorkClick }) => {
  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get in <span className="text-gradient">Touch</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to bring your creative vision to life with AI? Let's collaborate and build something amazing together.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="glass-effect rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>

            <h3 className="text-2xl font-semibold mb-4">Let's Create Together</h3>
            <p className="text-muted-foreground mb-8">
              Whether you need AI-powered tools, creative automation, or business solutions,
              I'm here to help transform your ideas into reality.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group interactive-button">
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=ashish@creative4ai.com&su=Inquiry%20from%20your%20portfolio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start a Conversation
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>

              <Button variant="outline" size="lg" onClick={handleViewWorkClick} className="interactive-button">
                View My Work
              </Button>
            </div>

            <div className="flex justify-center space-x-6 mt-8 pt-8 border-t border-border">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit my ${social.label} profile`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-primary/10 hover:text-primary"
                  >
                    {social.icon}
                  </Button>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;