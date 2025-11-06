import { Button } from "@/components/ui/button";
import { ArrowRight, Activity } from "lucide-react";
import heroImage from "@/assets/hero-sac.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Student Activity Center" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-8 h-8 text-primary animate-pulse-glow" />
            <span className="text-sm font-semibold tracking-wider text-primary uppercase">
              Smart SAC Management
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Campus
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Sports Hub
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
            Real-time equipment tracking, player connections, and seamless booking—all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg group bg-gradient-primary hover:shadow-glow transition-all">
              Get Started
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg border-2">
              View Equipment
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/50">
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground mt-1">Equipment Items</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl md:text-4xl font-bold text-secondary">10+</div>
              <div className="text-sm text-muted-foreground mt-1">Activity Rooms</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-3xl md:text-4xl font-bold text-accent">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Availability Check</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
