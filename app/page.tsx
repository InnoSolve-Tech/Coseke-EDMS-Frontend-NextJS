import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  Users,
  Search,
  Archive,
  Clock,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-40 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-emerald-500 p-3 rounded-xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">Coseke EDMS</h1>
                <p className="text-xs text-emerald-400 font-medium">
                  Enterprise Solution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-2">
                <Star className="h-3 w-3 mr-2" />
                Trusted by 10k+ companies
              </Badge>
              <Link href="/login">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2 shadow-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-6 py-3 text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              ISO 27001 Certified • SOC 2 Compliant
            </Badge>
          </div>

          <h2 className="text-6xl lg:text-8xl font-bold text-white mb-12 leading-tight tracking-tight">
            Next-Generation
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Document Intelligence
            </span>
          </h2>

          <p className="text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Transform your organization with AI-powered document management.
            Streamline workflows, enhance security, and unlock insights from
            your content.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-20">
            <Link href="/login">
              <Button
                size="lg"
                className="px-12 py-6 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              className="px-12 py-6 text-lg font-semibold bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">99.9%</div>
              <div className="text-gray-400 text-lg">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">10M+</div>
              <div className="text-gray-400 text-lg">Documents Processed</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">500+</div>
              <div className="text-gray-400 text-lg">Enterprise Clients</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">24/7</div>
              <div className="text-gray-400 text-lg">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 px-6 py-3 text-sm font-medium">
              Enterprise Features
            </Badge>
            <h3 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Everything You Need for
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Modern EDMS
              </span>
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive document management with cutting-edge AI and
              enterprise-grade security
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 group p-8">
              <CardHeader className="text-center space-y-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  Enterprise Security
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  Bank-grade encryption, zero-trust architecture, and
                  comprehensive audit trails
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 group p-8">
              <CardHeader className="text-center space-y-6">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  Smart Collaboration
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  AI-powered workflows, real-time editing, and intelligent task
                  automation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 group p-8">
              <CardHeader className="text-center space-y-6">
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-violet-500/25">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  AI-Powered Search
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  Natural language queries, semantic search, and intelligent
                  content discovery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 group p-8">
              <CardHeader className="text-center space-y-6">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                  <Archive className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  Intelligent Archiving
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  Automated lifecycle management, compliance monitoring, and
                  cost optimization
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 group p-8">
              <CardHeader className="text-center space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-6 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  Version Intelligence
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  Smart versioning, change analytics, and automated conflict
                  resolution
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-500 group p-8">
              <CardHeader className="text-center space-y-6">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-6 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-teal-500/25">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-white text-2xl font-bold">
                  Process Automation
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg leading-relaxed">
                  No-code workflow builder, AI-driven approvals, and seamless
                  integrations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-16 border border-white/10 text-center">
            <h3 className="text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Transform Your
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Document Workflow?
              </span>
            </h3>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join industry leaders who trust Coseke EDMS for their
              mission-critical document management needs
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="px-12 py-6 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                className="px-12 py-6 text-lg font-semibold bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-300"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-xl border-t border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-emerald-500 p-3 rounded-xl shadow-lg mr-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">Coseke EDMS</span>
            </div>
            <p className="text-gray-300 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
              Empowering organizations worldwide with intelligent document
              management solutions
            </p>
            <div className="flex justify-center space-x-12 mb-12">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-lg"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-lg"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-lg"
              >
                Support
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-lg"
              >
                Contact
              </a>
            </div>
            <p className="text-gray-500 text-base">
              © {new Date().getFullYear()} Coseke EDMS System. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
