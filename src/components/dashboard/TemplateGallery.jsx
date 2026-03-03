import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Target, MessageSquare, Code, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import templates from '../../data/templates.json';

const IconMap = {
    'tpl_sentiment_01': Target,
    'tpl_leadgen_02': Zap,
    'tpl_agent_03': Layout
};

const CategoryColors = {
    'Customer Success': 'bg-primary/10 text-primary border-primary/20',
    'Sales & Marketing': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Automation': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
};

const TemplateGallery = () => {
    const navigate = useNavigate();

    const handleSelectTemplate = (template) => {
        // Store selected template in session storage for the builder to pick up
        sessionStorage.setItem('selected_template', JSON.stringify(template));
        navigate('/builder');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, idx) => {
                const Icon = IconMap[tpl.id] || Sparkles;
                return (
                    <motion.div
                        key={tpl.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSelectTemplate(tpl)}
                        className="glass-effect p-8 rounded-[2.5rem] border border-white/5 group cursor-pointer hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 relative overflow-hidden"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-slate-900 rounded-2xl border border-white/10 group-hover:border-primary/30 transition-colors">
                                    <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${CategoryColors[tpl.category]}`}>
                                    {tpl.category}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 font-outfit leading-tight group-hover:text-primary transition-colors">
                                    {tpl.name}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                                    {tpl.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blueprint Protocol</span>
                                <div className="flex items-center gap-1 text-primary font-bold text-xs">
                                    Deploy <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default TemplateGallery;
