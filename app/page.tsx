import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Shield, Users, Search, Archive, Clock, ArrowRight, CheckCircle } from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements with logo colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-40 w-64 h-64 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image src="/logo.png" alt="NLGRB Logo" width={200} height={200} className="rounded-lg shadow-lg" />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">ChetaDocs</h1>
                <p className="text-xs text-accent font-medium">Enterprise Document Management</p>
              </div>
            </div>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 shadow-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Badge className="bg-accent/20 text-accent border-accent/30 px-6 py-3 text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              Regulatory Compliant • Secure
            </Badge>
          </div>
          <h2 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
            Smart Document
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Management System
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Streamline your document workflows with AI-powered management, enterprise security, and regulatory
            compliance.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="px-10 py-5 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/25 transition-all duration-300 hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">Enterprise-Grade Features</h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Everything you need for modern document management
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group p-6">
              <CardHeader className="text-center space-y-4">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl font-bold">Enterprise Security</CardTitle>
                <CardDescription className="text-gray-300 leading-relaxed">
                  Bank-grade encryption and comprehensive audit trails
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group p-6">
              <CardHeader className="text-center space-y-4">
                <div className="bg-gradient-to-br from-accent to-accent/80 p-4 rounded-xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-accent/25">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl font-bold">Smart Collaboration</CardTitle>
                <CardDescription className="text-gray-300 leading-relaxed">
                  AI-powered workflows and real-time collaboration
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group p-6">
              <CardHeader className="text-center space-y-4">
                <div className="bg-gradient-to-br from-secondary to-secondary/80 p-4 rounded-xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-secondary/25">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl font-bold">AI-Powered Search</CardTitle>
                <CardDescription className="text-gray-300 leading-relaxed">
                  Natural language queries and intelligent discovery
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group p-6">
              <CardHeader className="text-center space-y-4">
                <div className="bg-gradient-to-br from-muted to-muted/80 p-4 rounded-xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-muted/25">
                  <Archive className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl font-bold">Smart Archiving</CardTitle>
                <CardDescription className="text-gray-300 leading-relaxed">
                  Automated lifecycle management and compliance
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group p-6">
              <CardHeader className="text-center space-y-4">
                <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl font-bold">Version Control</CardTitle>
                <CardDescription className="text-gray-300 leading-relaxed">
                  Smart versioning and automated conflict resolution
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 group p-6">
              <CardHeader className="text-center space-y-4">
                <div className="bg-gradient-to-br from-secondary to-accent p-4 rounded-xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-secondary/25">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl font-bold">Process Automation</CardTitle>
                <CardDescription className="text-gray-300 leading-relaxed">
                  No-code workflows and seamless integrations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
            <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">Ready to Get Started?</h3>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join organizations that trust Coseke EDMS for their document management needs
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="px-10 py-5 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/25 transition-all duration-300 hover:scale-105"
              >
                Start Now
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-xl border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Image src="/logo.png" alt="NLGRB Logo" width={200} height={200} className="rounded-lg shadow-lg mr-3" />
            </div>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Empowering organizations with intelligent document management solutions
            </p>
            <div className="flex justify-center space-x-8 mb-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Coseke ChetaDocs. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}