import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-24 h-24 rounded-full gradient-primary mx-auto flex items-center justify-center mb-6 opacity-50">
          <BookOpen className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-6xl font-extrabold gradient-text mb-4">404</h1>
        <p className="text-xl font-semibold mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8">Looks like this page got lost in a chapter...</p>
        <Link to="/dashboard">
          <Button className="gradient-primary border-0 text-white">Go to Dashboard</Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
