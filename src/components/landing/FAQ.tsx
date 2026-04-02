import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'What AI model powers ChapterWave?', a: 'ChapterWave uses advanced AI models to generate outlines, write chapters, and improve your content. The AI is continuously updated for the best writing quality.' },
  { q: 'Can I edit AI-generated content?', a: 'Absolutely! All AI-generated content is fully editable. Think of AI as your writing partner — it creates the first draft, and you refine it to your voice.' },
  { q: 'What export formats are supported?', a: 'Currently we support PDF and Markdown exports. PDF includes a beautifully formatted cover page, table of contents, and styled chapters.' },
  { q: 'Is my writing data private?', a: 'Yes. Your data is encrypted, stored securely, and never shared with third parties. You own everything you write.' },
  { q: 'Can I use ChapterWave on mobile?', a: 'Yes! ChapterWave is fully responsive and works great on tablets and phones with an optimized mobile interface.' },
  { q: 'How does the writing streak work?', a: 'Write at least once daily to build your streak. The streak counter tracks consecutive writing days and celebrates milestones.' },
  { q: 'Can I collaborate with co-authors?', a: 'Collaboration features are coming soon! For now, ChapterWave is designed for individual authors.' },
  { q: 'How do I cancel my subscription?', a: 'You can cancel your Pro subscription anytime from your profile settings. You\'ll keep Pro access until the end of your billing period.' },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="glass rounded-xl px-6 border-0">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
