import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent!", description: "We'll get back to you soon." });
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="container mx-auto px-4 pb-24 pt-28">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold">Get in <span className="text-gradient-blue">Touch</span></h1>
          <p className="mt-3 text-muted-foreground">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Info */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3"><Mail className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-display font-semibold">Email</h3>
                  <p className="text-sm text-muted-foreground">support@aiheartcare.com</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3"><Phone className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-display font-semibold">Phone</h3>
                  <p className="text-sm text-muted-foreground">+92 3355444667</p>
                  <p className="text-sm text-muted-foreground">+92 3129381385</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3"><MapPin className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-display font-semibold">Address</h3>
                  <p className="text-sm text-muted-foreground">Paf-Iast, Mang, Haripur, Pakistan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" placeholder="Your name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-message">Message</Label>
              <Textarea id="c-message" placeholder="How can we help?" rows={5} required />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
