/**
 * Landing Page - CommunityPulse
 * Marketing homepage with conversion-focused design
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { 
  BarChart3, MessageSquare, Users, Shield, Zap, 
  ArrowRight, Check, Star, Play, ChevronDown 
} from 'lucide-react';

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      
      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary-600 text-white p-2 rounded-lg group-hover:bg-primary-700 transition">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">CommunityPulse</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">How It Works</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">Testimonials</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">Pricing</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition hidden sm:inline">
                    Sign In
                  </Link>
                  <Button onClick={handleGetStarted}>Get Started Free</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <Zap className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">AI-Powered Sentiment Analysis</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Understand Your Community's{' '}
                <span className="text-primary-600">True Feelings</span>{' '}
                in Real-Time
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                CommunityPulse helps schools, churches, and organizations collect anonymous feedback, 
                analyze sentiment with AI, and make data-driven decisions to build stronger communities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleGetStarted} className="group">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <a href="#how-it-works">Watch Demo</a>
                </Button>
              </div>
              
              {/* Trust badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white dark:border-gray-900" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Trusted by 500+ communities</p>
                  <p className="text-xs text-gray-500">Schools • Churches • Nonprofits • Student Groups</p>
                </div>
              </div>
            </div>

            {/* Right: Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-200 to-blue-200 dark:from-primary-900/20 dark:to-blue-900/20 rounded-3xl blur-3xl opacity-50" />
              <Card className="relative shadow-2xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-4 text-xs text-gray-500">dashboard.communitypulse.app</span>
                </div>
                
                {/* Dashboard Content */}
                <CardContent className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Feedback', value: '1,247', color: 'primary' },
                      { label: 'Positive', value: '68%', color: 'sentiment-positive' },
                      { label: 'Needs Attention', value: '12', color: 'sentiment-negative' }
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart Placeholder */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 h-32 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-20">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div 
                          key={i} 
                          className="w-4 bg-gradient-to-t from-primary-500 to-primary-300 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Recent Feedback */}
                  <div className="space-y-2">
                    {[
                      { text: 'The new library hours are perfect!', sentiment: 'Positive' },
                      { text: 'Parking is still a challenge...', sentiment: 'Negative' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          item.sentiment === 'Positive' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.text}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.sentiment === 'Positive' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.sentiment}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary-500 rounded-2xl rotate-12 opacity-20 animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500 rounded-xl -rotate-12 opacity-20 animate-pulse delay-300" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to{' '}
              <span className="text-primary-600">Listen & Act</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful features designed to help you understand your community and make meaningful improvements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: 'Anonymous Feedback',
                description: 'Members can share honest feedback without fear of judgment. Build trust through privacy.',
                color: 'primary'
              },
              {
                icon: BarChart3,
                title: 'AI Sentiment Analysis',
                description: 'Automatic emotion detection identifies positive, neutral, and negative feedback instantly.',
                color: 'green'
              },
              {
                icon: Users,
                title: 'Real-Time Dashboards',
                description: 'Live charts and trends help you spot issues before they become crises.',
                color: 'blue'
              },
              {
                icon: Shield,
                title: 'Role-Based Access',
                description: 'Secure permissions ensure members see only what they should, admins get full insights.',
                color: 'purple'
              },
              {
                icon: Zap,
                title: 'Priority Alerts',
                description: 'Get notified when negative sentiment spikes or urgent issues need attention.',
                color: 'yellow'
              },
              {
                icon: Play,
                title: 'Export & Report',
                description: 'Download CSV/PDF reports to share insights with stakeholders or board members.',
                color: 'pink'
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow group">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How CommunityPulse Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get started in minutes. No technical expertise required.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your organization account in under 2 minutes.' },
              { step: '2', title: 'Invite Members', description: 'Share your unique link. Members join with email or SSO.' },
              { step: '3', title: 'Collect Feedback', description: 'Members submit anonymous feedback anytime, anywhere.' },
              { step: '4', title: 'Take Action', description: 'Review insights, prioritize issues, and track improvements.' }
            ].map((item, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent -translate-x-1/2" />
                )}
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button size="lg" onClick={handleGetStarted}>
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="mt-4 text-sm text-gray-500">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Community Leaders
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              See how organizations like yours are building stronger communities with CommunityPulse.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "CommunityPulse helped us identify a facilities issue before it became a crisis. We fixed it in days, not months.",
                author: "Sarah Chen",
                role: "Principal, Lincoln High School",
                avatar: "SC"
              },
              {
                quote: "The anonymous feedback feature increased participation by 300%. Our members finally feel heard.",
                author: "Marcus Johnson",
                role: "Director, Riverside Church",
                avatar: "MJ"
              },
              {
                quote: "As a student group leader, I love how easy it is to gauge sentiment and prioritize our initiatives.",
                author: "Priya Patel",
                role: "President, Tech Students Union",
                avatar: "PP"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start free. Upgrade when you're ready. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="p-8 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Starter</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Perfect for small groups</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Up to 50 members', '100 feedback submissions/mo', 'Basic sentiment analysis', 'Email support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full" onClick={handleGetStarted}>
                Get Started Free
              </Button>
            </Card>

            {/* Pro Tier (Highlighted) */}
            <Card className="p-8 border-2 border-primary-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Professional</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For growing communities</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Up to 500 members', 'Unlimited feedback', 'Advanced AI analysis', 'Priority alerts', 'CSV/PDF exports', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={handleGetStarted}>
                Start 14-Day Free Trial
              </Button>
            </Card>

            {/* Enterprise Tier */}
            <Card className="p-8 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Enterprise</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For large organizations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited members', 'Custom AI models', 'SSO/SAML integration', 'Dedicated support', 'SLA guarantee', 'On-premise option'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full" asChild>
                <a href="mailto:sales@communitypulse.org">Contact Sales</a>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-blue-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Understand Your Community Better?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of organizations using CommunityPulse to build stronger, more engaged communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={handleGetStarted}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="ghost" className="text-white border-white hover:bg-white/10" asChild>
              <a href="mailto:hello@communitypulse.org">Schedule a Demo</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-100">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="bg-primary-600 text-white p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-white">CommunityPulse</span>
              </Link>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering communities through real-time sentiment analysis and anonymous feedback.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
                  <a key={social} href="#" className="text-gray-400 hover:text-white transition" aria-label={social}>
                    {social}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Integrations', 'Changelog'].map(link => (
                  <li key={link}><a href="#" className="hover:text-white transition">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map(link => (
                  <li key={link}><a href="#" className="hover:text-white transition">{link}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} CommunityPulse. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition">Terms of Service</a>
              <a href="/cookies" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 p-3 bg-primary-600 text-white rounded-full shadow-lg transition-all z-40 ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ChevronDown className="w-5 h-5 rotate-180" />
      </button>
    </div>
  );
}