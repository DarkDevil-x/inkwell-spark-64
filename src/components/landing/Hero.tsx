import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered eBook Creation
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Write Your Book{' '}
            <span className="gradient-text">with AI.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            From blank page to published eBook — in days, not years. 
            AI-powered outlines, chapter generation, and one-click exports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary border-0 text-white text-base px-8 h-12 animate-pulse-glow">
                Start Writing Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              <Play className="mr-2 h-4 w-4" /> Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Join <span className="font-semibold text-foreground">2,400+</span> writers already using InkMind
          </p>
        </motion.div>

        {/* Editor mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass rounded-xl p-1 shadow-2xl shadow-primary/10">
            <div className="bg-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">InkMind Editor — Chapter 3: The Journey Begins</span>
              </div>
              <div className="p-8 text-left">
                <h2 className="font-book text-2xl font-semibold mb-4 text-foreground">Chapter 3: The Journey Begins</h2>
                <p className="font-book text-muted-foreground leading-relaxed mb-3">
                  The morning sun cast long shadows across the ancient cobblestones as Elena stepped through the city gates for the last time. She carried nothing but a leather satchel and the weight of a promise made to a dying king.
                </p>
                <p className="font-book text-muted-foreground leading-relaxed">
                  The road ahead stretched endlessly, winding through emerald valleys and over misty peaks that touched the clouds. Somewhere beyond those mountains lay the answer she sought — 
                  <span className="border-r-2 border-primary animate-pulse">|</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
