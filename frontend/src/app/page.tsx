'use client';

import Link from "next/link";
import { CheckSquare, ArrowRight, Shield, Clock, Layers, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-violet-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/55 dark:border-zinc-800/55 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-violet-600" />
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              TaskFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-md shadow-violet-100 dark:shadow-none"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center md:py-32">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30 px-3.5 py-1 text-sm font-medium text-violet-700 dark:text-violet-300">
            <Sparkles className="h-4 w-4" />
            <span>Powering real-time execution</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            Streamline your work with{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-lg text-zinc-500 dark:text-zinc-400 sm:text-xl leading-relaxed">
            The next-generation, real-time task manager designed for professionals. 
            Organize tasks, track activity timelines, and collaborate seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 dark:shadow-none cursor-pointer"
            >
              Start for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3.5 text-base font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mt-24 text-left px-4">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Realtime SSE Stream</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Experience instant dashboard synchronization via Server-Sent Events. Your tasks refresh live.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Activity Logs</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              Every status edit, assignment change, and deletion is automatically logged in an audit timeline.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Secure Encrypted Session</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
              HTTP-only JWT cookies protect your login state from client-side script interception.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/55 dark:border-zinc-800/55 bg-white dark:bg-zinc-950 py-8 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
