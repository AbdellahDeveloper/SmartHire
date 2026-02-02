"use client"

import { buttonVariants } from "@/components/ui/button"
import { Particles } from "@/components/ui/particles"
import { cn } from "@/lib/utils"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
    return (
        <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-6">
            <Particles
                className="absolute inset-0 z-0"
                quantity={80}
                staticity={40}
                color="#ffffff"
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10 max-w-3xl w-full text-center space-y-10">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Sparkles className="size-3.5" />
                        <span>Modern Recruitment Intelligence</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                        Smart Hire
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        Revolutionize your hiring process. Our AI-driven platform helps you identify top talent faster and make smarter placement decisions with ease.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                    <Link
                        href="/auth"
                        className={cn(
                            buttonVariants({ size: "lg" }),
                            "h-12 px-8 text-base font-medium rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 pointer-events-auto flex items-center gap-2"
                        )}
                    >
                        Login to Dashboard
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 text-sm text-muted-foreground/40 font-medium z-10 animate-in fade-in duration-1000 delay-700">
                <span>Simplified Recruitment</span>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                <span>AI Integration</span>
            </div>
        </main>
    )
}