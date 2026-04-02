import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Sarah Chen', role: 'Self-Help Author', text: 'ChapterWave helped me write my first book in just 2 weeks. The AI outlines are incredible!', stars: 5 },
  { name: 'Marcus Rivera', role: 'Fiction Writer', text: 'The chapter generation saves me hours of staring at blank pages. Game-changer.', stars: 5 },
  { name: 'Dr. Anika Patel', role: 'Technical Writer', text: 'Finally a writing tool that understands structure. Export to PDF is flawless.', stars: 5 },
  { name: 'James Okonkwo', role: 'Business Author', text: 'From outline to finished book in days. My publisher was amazed at the quality.', stars: 5 },
  { name: 'Emily Larsson', role: 'Children\'s Author', text: 'The AI suggestions for my children\'s books are creative and age-appropriate.', stars: 4 },
  { name: 'David Kim', role: 'Biography Writer', text: 'ChapterWave keeps me on track with writing goals and streak tracking. Love it!', stars: 5 },
];

export default function Testimonials() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by <span className="gradient-text">Writers</span>
          </h2>
          <p className="text-muted-foreground">See what authors are saying about ChapterWave.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-6 hover:-translate-y-1 transition-transform"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
