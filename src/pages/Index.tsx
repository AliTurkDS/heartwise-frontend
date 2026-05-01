import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Brain, Calendar, Shield, Activity, FileText, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Brain,
    title: "AI Risk Prediction",
    description: "Advanced machine learning models analyze your medical data to predict heart disease risk with high accuracy.",
  },
  {
    icon: Activity,
    title: "ECG Analysis",
    description: "Upload your ECG images for instant AI-powered analysis and interpretation.",
  },
  {
    icon: Calendar,
    title: "Smart Appointments",
    description: "Book appointments with cardiologists and manage your healthcare schedule effortlessly.",
  },
  {
    icon: FileText,
    title: "Medical Reports",
    description: "Securely upload and store your medical reports for easy access by you and your doctor.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your health data is encrypted and protected with enterprise-grade security measures.",
  },
  {
    icon: Heart,
    title: "Continuous Monitoring",
    description: "Track your heart health over time with comprehensive dashboards and alerts.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mx-auto inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            AI-Powered Heart Disease Risk Assessment
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Revolutionizing{" "}
            <span className="text-gradient-heart">Heart</span>
            <br />
            <span className="text-gradient-blue">Healthcare</span> with AI
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Predict heart disease risk, analyze ECG reports, and connect with top cardiologists — all powered by cutting-edge artificial intelligence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="glow-blue gap-2 text-base">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-base">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Powerful <span className="text-gradient-blue">Features</span>
            </h2>
            <p className="mt-3 text-muted-foreground">Everything you need for proactive heart health management</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:glow-blue"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-12 text-center glow-blue">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-heart/5" />
            <div className="relative z-10">
              <Heart className="mx-auto h-12 w-12 text-heart animate-pulse-glow" />
              <h2 className="mt-6 font-display text-3xl font-bold">Ready to Take Control of Your Heart Health?</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Join thousands of patients and doctors using AI HeartCare for smarter cardiac care.
              </p>
              <Link to="/register">
                <Button size="lg" className="mt-6 gap-2">
                  Create Your Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
