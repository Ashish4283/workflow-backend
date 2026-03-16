import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Sparkles, Star, Play, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import fuzzyMatcherImage from '@/img/Portfolio/Gemini_Fuzzy_Match_Tool.png';
import webCopilotImage from '@/img/Portfolio/AI_Powered_Data_Extraction.png';
import imageExtractorExtensionImage from '@/img/Portfolio/Image_Extraction_Extention.png';
import imageResequencerImage from '@/img/Portfolio/Image_Reorder_Resequencer.png';
import DashboardingImage from '@/img/Portfolio/Dashboarding.png';
import aiMenuExtractorImage from '@/img/Portfolio/AI_Powered_Data_IMG_PDF_to_Text.png';
import scoreboardImage from '@/img/Portfolio/Scoreboard_Main.jpg';
import scoreboardVideo from '@/img/Portfolio/Scoreboard_Demo.mp4';

const portfolioProjects = [
  {
    title: 'Scoreboard PWA – Material Design 3 Gaming Companion',
    description:
      'A high-performance Progressive Web App (PWA) designed for real-time game scoring. Built with a focus on mobile-first user experience, it features Material Design 3 aesthetics, a custom optimized keypad for rapid score entry, and offline capabilities. The app eliminates the need for physical score sheets, providing a seamless, interactive way to track players, rounds, and historical game data directly on any device.',
    icon: <Activity className="w-6 h-6" />,
    featured: true,
    imageAlt: 'Scoreboard PWA mobile interface showing player scores',
    imageSrc: scoreboardImage,
    videoSrc: scoreboardVideo,
    impact:
      'Replaced paper-based tracking with a 100% digital, eco-friendly solution. Optimized data entry speed by ~60% using a custom-built numerical keypad. Supports up to 10 players with automated leaderboard sorting and round history. Installable as a native-like app on Android and iOS with full offline support.',
    techStack: 'Vanilla JavaScript • Material Design 3 • PWA • HTML5/CSS3',
    demoUrl: 'https://creative4ai.com/scoreboard/index.html',
  },
  {
    title: 'Fuzzy Matcher – AI + Gemini-powered Auto Matching Tool',
    description:
      'Originally developed pre-AI as a JSON-based search engine to process 650,000+ product records where traditional spreadsheet features (dropdowns, index matching) failed due to inconsistent naming formats. The first version reduced manual matching time from 3–4 minutes → ~55 seconds, delivering ~75% efficiency gains and lowering costs from $1 → $0.33 per item. With AI advancements, the tool evolved into a hybrid AI-human fuzzy matching system, adding automated matching, AI-powered quality assurance, massive-scale batch processing, and a modern UI built with React (frontend) and TypeScript (backend).',
    icon: <Sparkles className="w-6 h-6" />,
    featured: true,
    imageAlt: 'AI-powered fuzzy matching tool interface',
    imageSrc: fuzzyMatcherImage,
    impact:
      'Cut manual costs by 45% (from $1 → $0.33/item). Further reduced 45% of workload to ~$0.01/item with AI-assisted automation. Achieved >95% precision in fuzzy matching with human oversight. Delivered enterprise-grade reliability, saving clients ≈ $1M overall (~$35K–$50K/month). Not only reduced costs but also accelerated delivery, enhanced quality, and improved overall operational efficiency.',
    techStack: 'TypeScript · Gemini API',
  },
  {
    title: 'Web Copilot – AI-Powered Online Data Extractor (Chrome Extension)',
    description:
      'Manually collecting structured data from websites is slow, repetitive, and error-prone. Web Copilot solves this by acting as an AI-powered browser assistant that automates the entire process. It navigates across pages, extracts structured elements (menus, product listings, tables), applies LLM-powered parsing and summarization, and exports the data directly into CSV/Google Sheets. Users can define custom prompts and reusable templates, turning a tedious manual process into a fast, consistent, and repeatable workflow.',
    icon: <Sparkles className="w-6 h-6" />,
    imageAlt: 'Web Copilot AI Data Extractor interface',
    imageSrc: webCopilotImage,
    impact:
      'Reduced data extraction from hours/days to minutes. Automated multi-page navigation and menu/product list parsing. Delivered AI-powered summarization & formatting for ready-to-use datasets. Enabled reusable templates and custom prompt workflows inside the browser. Improved both speed and data quality, reducing reliance on manual teams.',
    techStack: 'Chrome Extension (Manifest V3) · React · Tailwind · TypeScript · OpenAI/Gemini API',
    demoUrl: 'https://youtu.be/sN8oCdnB3TE',
  },
  {
    title: 'Image Resequencer – Smart Tool to Rearrange Image Links',
    description:
      'Solved the highly repetitive and error-prone task of resequencing 8–12 image URLs per row across 10,000–20,000 spreadsheet entries. Previously, users had to open each URL one by one and manually decide the order as per SOP — a simple but extremely time-consuming process. The tool loads all images on one page with large thumbnails (enlargeable if needed), provides an easy box to assign sequence numbers, and outputs a transposed result ready for direct copy-paste into the output file.',
    icon: <Camera className="w-6 h-6" />,
    imageAlt: 'Image Resequencer tool interface',
    imageSrc: imageResequencerImage,
    impact:
      'Reduced per-task effort from 3–5 minutes to ~1 minute, increasing throughput by 3–5x per operator. Cut manual QA/review costs by 45% ($1 → $0.55/item), improved accuracy by ~25%, and reduced team size from 4-5 people to 1 operator. Delivered overall savings of ≈ $200K+ while enabling faster delivery and higher consistency.',
    techStack: 'JavaScript • Spreadsheet Integration • Web UI Automation',
  },
  {
    title: 'AI Menu Extractor – Image & PDF to Text/Table',
    description:
      "Extracting structured data from PDFs and images is one of the most tedious tasks. Even with OCR, results are often messy and require hours of manual cleanup. This AI-powered application takes an image or multi-page PDF and instantly converts it into structured, editable JSON or table data. Users can then review and make minor corrections in a clean UI instead of rebuilding everything from scratch, reducing manual effort from hours of data entry to a quick review task.",
    icon: <Sparkles className="w-6 h-6" />,
    imageAlt: 'AI Menu Extractor application interface',
    imageSrc: aiMenuExtractorImage,
    impact:
      'Transformed hours of manual data entry to minutes of review. Automated extraction & structuring of complex PDF/image menus. Improved accuracy and reduced human error compared to OCR-only approaches. Showcased advanced prompt engineering + serverless full-stack development, delivering faster turnaround and significant cost savings.',
    techStack: 'React · TypeScript · Gemini API · Serverless Cloud Backend',
    demoUrl: 'https://youtu.be/7WOIffQXO2Q',
  },
  {
    title: 'JPG Image Extractor — Bulk Downloader & Renamer',
    description:
      'Addressed the tedious, manual process of saving web images, which often come in inconsistent formats (like WEBP or PNG) with random filenames. This lightweight Chrome extension streamlines the workflow by allowing users to extract all images from a page, automatically convert them to JPG, and apply custom naming patterns (e.g., `Product-001.jpg`).',
    icon: <Camera className="w-6 h-6" />,
    imageAlt: 'JPG Image Extractor Chrome Extension interface',
    imageSrc: imageExtractorExtensionImage,
    impact:
      'Streamlined the workflow for collecting web images for product catalogs, mood boards, or research. Eliminated the need for manual file conversion and renaming, ensuring organized and consistent file management. The bulk ZIP download feature further simplified storing and sharing large image sets.',
    techStack: 'JavaScript • Chrome Extension API • File System Access API',
  },
  {
    title: 'AI Tooling & Prompt Engineering',
    description:
      'Vast experience in understanding traditional business challenges, solving them with creativity, and then leveraging AI to take solutions to the next level. Got a project that needs a custom AI solution or an intelligent dashboard? Let’s talk. I offer free, no-obligation demos to show how your ideas can be transformed into working solutions.',
    icon: <Sparkles className="w-6 h-6" />,
    imageAlt: 'AI tooling and prompt engineering dashboard',
    imageSrc: DashboardingImage,
  },
];
const PortfolioSection = () => {
  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Creator's <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Showcasing innovative AI-powered solutions that blend creativity with cutting-edge technology.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioProjects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-xl glass-effect card-hover shine-effect flex flex-col ${project.featured ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
            >
              <div className="aspect-video relative overflow-hidden bg-slate-900 flex items-center justify-center">
                {project.videoSrc ? (
                  <>
                    {/* Blurred Background for vertical videos */}
                    <video
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110"
                      src={project.videoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <video
                      className="relative z-10 h-full w-auto object-contain group-hover:scale-105 transition-transform duration-700"
                      src={project.videoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  </>
                ) : (
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src={project.imageSrc}
                    alt={project.imageAlt}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                {project.featured && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                  <div className="flex items-center mb-3">
                    <div className="text-primary mr-2">{project.icon}</div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">{project.description}</p>

                  {project.impact && (
                    <div className="mt-4 pt-4 border-t border-border/20">
                      <h4 className="text-sm font-semibold text-primary mb-2">Key Impact</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{project.impact}</p>
                    </div>
                  )}
                  {project.techStack && (
                    <div className="mt-4 pt-4 border-t border-border/20">
                      <h4 className="text-sm font-semibold text-primary mb-2">Tech Stack</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{project.techStack}</p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  {project.demoUrl ? (
                    <Button asChild variant="outline" size="sm" className="w-full group">
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                        View Demo
                        <Play className="w-3 h-3 ml-2 group-hover:scale-110 transition-transform" />
                      </a>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" size="sm" className="w-full group">
                      <a href={`mailto:ashish@creative4ai.com?subject=Demo%20Request:%20${encodeURIComponent(project.title)}`} target="_blank" rel="noopener noreferrer">
                        Request Demo
                        <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;