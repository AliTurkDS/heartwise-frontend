import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/50 bg-background">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Heart className="h-5 w-5 text-heart fill-heart/20" />
            <span className="text-gradient-blue">AI HeartCare</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            AI-powered heart disease risk prediction and appointment management system.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display font-semibold text-foreground">Platform</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display font-semibold text-foreground">Features</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>Heart Risk Prediction</span>
            <span>ECG Analysis</span>
            <span>Appointment Booking</span>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display font-semibold text-foreground">Contact</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>turk5337@gmail.com, +92 3369668735</span>
            <span>malikshomail968@gmail.com, +92 3355444667</span>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
        © 2026 AI HeartCare. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
