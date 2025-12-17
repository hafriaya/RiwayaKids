"use client";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Sparkles, Heart, Shuffle, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StoryBook } from "../components/StoryBook";
import type { GenerateStoryResponse } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [isRandom, setIsRandom] = useState(false);
  const [story, setStory] = useState<GenerateStoryResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [coverTitle, setCoverTitle] = useState<string | null>(null);
  const pagesRef = useRef<GenerateStoryResponse["pages"]>([]);

  async function generateStory() {
    setError(null);
    // Navigate to dedicated reader page with params
    const query = new URLSearchParams({
      subject,
      random: String(isRandom),
      pages: String(10),
      ageRange: "4-7",
    }).toString();
    router.push(`/read?${query}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-sky-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-800">Riwaya Kids</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-blue-700 hover:text-blue-900 font-medium">Home</a>
            <a href="#about" className="text-blue-700 hover:text-blue-900 font-medium">About Us</a>
            <a href="#testimonials" className="text-blue-700 hover:text-blue-900 font-medium">Testimonials</a>
            <a href="#library" className="text-blue-700 hover:text-blue-900 font-medium">Browse Story Library</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-50">
              Log In
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-blue-800 mb-6 leading-tight">
              Welcome to the Amazing World of
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Face Swapping Stories!
              </span>
            </h2>
            <p className="text-xl text-blue-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the magical journey where kids become the heroes of their favorite stories! 
              Upload your photo and watch yourself appear in beloved children's books, creating 
              personalized adventures that spark imagination and joy.
            </p>
            <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-sky-200 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <input
                  type="text"
                  placeholder="Enter a story subject (e.g., a brave goat on a mountain)"
                  className="flex-1 rounded-lg border border-sky-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isRandom || isPending}
                />
                <Button
                  variant={isRandom ? "default" : "outline"}
                  className={isRandom ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-purple-300 text-purple-700 hover:bg-purple-50"}
                  onClick={() => setIsRandom((v) => !v)}
                  disabled={isPending}
                >
                  <Shuffle className="mr-2 h-5 w-5" />
                  Random
                </Button>
                <Button
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                  onClick={() => startTransition(generateStory)}
                  disabled={isPending || (!isRandom && subject.trim().length === 0)}
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
              {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
            </div>
          </div>
          {/* Character Illustration Section */}
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-purple-50"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-center text-blue-800 mb-8">
                Meet Your Story Characters
              </h3>
              
              {/* Character Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
                {/* Character 1 - Boy with Goat */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-200 to-green-300 rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👦</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white text-sm">🐐</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Adventure Boy</p>
                </div>

                {/* Character 2 - Girl with Lamb */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-red-200 to-red-300 rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👧</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">🐑</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Story Girl</p>
                </div>

                {/* Character 3 - Magic Girl */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-200 to-purple-300 rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👧</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-purple-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Magic Reader</p>
                </div>

                {/* Character 4 - Book Boy */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-200 to-blue-300 rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">👦</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-300 to-red-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Book Lover</p>
                </div>

                {/* Character 5 - Happy Boy */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-orange-200 to-orange-300 rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">😊</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-300 to-green-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Happy Kid</p>
                </div>

                {/* Character 6 - Goat Friend */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">🐐</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-brown-300 to-brown-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white text-sm">🌿</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">Animal Friend</p>
                </div>
              </div>

              {/* Features Section */}
              <div className="mt-16 grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-blue-800 mb-2">AI-Powered Magic</h4>
                  <p className="text-blue-600">Advanced face swapping technology that seamlessly integrates your child's face into story characters.</p>
                </div>

                <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-blue-800 mb-2">Hundreds of Stories</h4>
                  <p className="text-blue-600">Choose from our vast library of beloved children's stories and fairy tales.</p>
                </div>

                <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-blue-800 mb-2">Safe & Secure</h4>
                  <p className="text-blue-600">Your child's photos are processed securely and never stored permanently.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cover + Open Reader Modal */}
          {(coverTitle || story) && (
            <div className="mt-16 flex flex-col items-center">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 border border-sky-100">
                <div className="h-56 rounded-xl bg-gradient-to-br from-sky-200 to-purple-200 flex items-center justify-center text-blue-800 text-2xl font-bold mb-4">
                  {coverTitle || story?.title || "Your Story"}
                </div>
                <div className="text-center text-blue-700 mb-4">{isPending ? "Preparing pages..." : "Ready"}</div>
                <div className="flex justify-center">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowReader(true)} disabled={!story?.pages?.length}>
                    Open Reader
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Reader */}
          {showReader && story && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowReader(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-sky-200 p-4 sm:p-6 max-w-5xl w-[95%]">
                <button className="absolute right-3 top-3 text-blue-700 hover:text-blue-900" onClick={() => setShowReader(false)}>
                  Close
                </button>
                {/* Force remount when page count changes */}
                <StoryBook key={story.pages.length} title={story.title} pages={story.pages} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
