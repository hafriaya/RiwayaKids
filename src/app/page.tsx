"use client";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Sparkles,
  Heart,
  Shuffle,
  Wand2,
  Image as ImageIcon,
  Upload,
  Compass,
  Feather,
  Smile,
  PawPrint,
  Mountain,
  Star,
  Headphones,
  Printer,
  Shield,
  Clock,
  Quote,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const characters = [
  { name: "Explorer", icon: Compass, companion: Mountain, from: "from-green-200 to-green-300", inner: "from-green-400 to-green-500", small: "from-emerald-300 to-emerald-400" },
  { name: "Storyteller", icon: Feather, companion: Star, from: "from-rose-200 to-rose-300", inner: "from-rose-400 to-rose-500", small: "from-amber-200 to-amber-300" },
  { name: "Magic Reader", icon: Wand2, companion: Sparkles, from: "from-purple-200 to-purple-300", inner: "from-purple-400 to-purple-500", small: "from-violet-300 to-violet-400" },
  { name: "Book Lover", icon: BookOpen, companion: Heart, from: "from-blue-200 to-blue-300", inner: "from-blue-400 to-blue-500", small: "from-sky-300 to-sky-400" },
  { name: "Happy Kid", icon: Smile, companion: Heart, from: "from-orange-200 to-orange-300", inner: "from-orange-400 to-orange-500", small: "from-green-300 to-green-400" },
  { name: "Animal Friend", icon: PawPrint, companion: Sparkles, from: "from-yellow-200 to-yellow-300", inner: "from-yellow-400 to-yellow-500", small: "from-lime-300 to-lime-400" },
];

export default function Home() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [isRandom, setIsRandom] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function generateStory() {
    setError(null);

    if (referenceImage) {
      sessionStorage.setItem("faceSwapReferenceImage", referenceImage);
    } else {
      sessionStorage.removeItem("faceSwapReferenceImage");
    }

    const query = new URLSearchParams({
      subject,
      random: String(isRandom),
      pages: String(5),
      ageRange: "4-7",
    }).toString();
    router.push(`/read?${query}`);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50">
      <header className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-sky-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#home" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-800">Riwaya Kids</span>
          </a>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-blue-700 hover:text-blue-900 font-medium">Home</a>
            <a href="#how" className="text-blue-700 hover:text-blue-900 font-medium">How it works</a>
            <a href="#parents" className="text-blue-700 hover:text-blue-900 font-medium">Why Riwaya</a>
            <a href="#comments" className="text-blue-700 hover:text-blue-900 font-medium">Comments</a>
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

      <main id="home" className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] mb-10">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">
                Their face.
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
                Their story.
              </span>
            </h1>

            <div className="max-w-2xl mx-auto mb-6 bg-white/80 backdrop-blur-sm border border-sky-200 rounded-2xl p-6 flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                <ImageIcon className="mr-2 h-6 w-6 text-blue-600" />
                Who is the hero of the story?
              </h2>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />

              {referenceImage ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 mb-4 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={referenceImage} alt="Hero's face" className="object-cover w-full h-full" />
                  </div>
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 text-sm"
                    onClick={() => setReferenceImage(null)}
                  >
                    Remove Face
                  </Button>
                </div>
              ) : (
                <div
                  className="w-full border-2 border-dashed border-sky-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-sky-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-blue-100 p-4 rounded-full mb-3">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-blue-800 font-medium mb-1">Click to upload a face photo</p>
                  <p className="text-blue-500 text-sm">JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>

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

          <div className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-purple-50"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-center text-blue-800 mb-8">
                Meet Your Story Characters
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
                {characters.map((character) => {
                  const Icon = character.icon;
                  const Companion = character.companion;
                  return (
                    <div key={character.name} className="text-center">
                      <div className={`bg-gradient-to-br ${character.from} rounded-full w-20 h-20 mx-auto mb-2 flex items-center justify-center shadow-lg`}>
                        <div className={`w-16 h-16 bg-gradient-to-br ${character.inner} rounded-full flex items-center justify-center`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-br ${character.small} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                        <Companion className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm text-blue-700 font-medium">{character.name}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">AI-Powered Magic</h3>
                  <p className="text-blue-600">Advanced face swapping technology that seamlessly integrates your child&apos;s face into story characters.</p>
                </div>

                <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">Hundreds of Stories</h3>
                  <p className="text-blue-600">Choose from our vast library of beloved children&apos;s stories and fairy tales.</p>
                </div>

                <div className="text-center p-6 bg-white/60 rounded-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">Safe & Secure</h3>
                  <p className="text-blue-600">Your child&apos;s photos are processed securely and never stored permanently.</p>
                </div>
              </div>
            </div>
          </div>

          <section id="how" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-center text-blue-800 mb-8">How it works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "Upload a photo", text: "Add a clear picture of your child.", icon: Upload, color: "from-sky-500 to-blue-500" },
                { step: "02", title: "Pick a story", text: "Type an idea, or let us surprise you.", icon: Wand2, color: "from-purple-500 to-pink-500" },
                { step: "03", title: "Read together", text: "Open a short book with them on every page.", icon: BookOpen, color: "from-teal-500 to-emerald-500" },
              ].map((item) => (
                <div key={item.step} className="bg-white/80 border border-sky-200 rounded-2xl p-6 text-center shadow-sm">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-sky-500 mb-1">{item.step}</p>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">{item.title}</h3>
                  <p className="text-blue-600">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="parents" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-center text-blue-800 mb-8">Why parents choose Riwaya</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "They are the hero", text: "The story is about your child, not a stranger.", icon: Smile, color: "from-orange-400 to-rose-500" },
                { title: "Ready for bedtime", text: "A short book, made in a few minutes.", icon: Clock, color: "from-blue-500 to-indigo-500" },
                { title: "Gentle stories", text: "Simple words, warm pictures, ages 4–7.", icon: Heart, color: "from-pink-500 to-red-400" },
                { title: "Private photos", text: "Used to build the book, then not kept.", icon: Shield, color: "from-teal-500 to-cyan-500" },
              ].map((item) => (
                <div key={item.title} className="text-center p-6 bg-white/80 border border-sky-200 rounded-2xl shadow-sm">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-800 mb-2">{item.title}</h3>
                  <p className="text-blue-600 text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="more" className="mt-16 scroll-mt-24 grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white border border-sky-200 shadow-lg p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-5 flex items-center justify-center">
                <Printer className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">A real book</h2>
              <p className="text-blue-600 mb-5">Turn the story into a printed keepsake you can hold at bedtime.</p>
              <ul className="space-y-2 text-blue-700 text-sm list-disc pl-5">
                <li>Soft cover, made from their pages</li>
                <li>A gift for birthdays and grandparents</li>
                <li>The same face, on paper</li>
              </ul>
            </div>
            <div className="rounded-3xl bg-white border border-sky-200 shadow-lg p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full mb-5 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Listen along</h2>
              <p className="text-blue-600 mb-5">Hear the story read aloud while you turn the pages together.</p>
              <ul className="space-y-2 text-blue-700 text-sm list-disc pl-5">
                <li>A calm voice for bedtime</li>
                <li>Hands-free when they are sleepy</li>
                <li>The pictures stay on screen</li>
              </ul>
            </div>
          </section>

          <section id="comments" className="mt-16 scroll-mt-24">
            <h2 className="text-3xl font-bold text-center text-blue-800 mb-8">What parents say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "She pointed at every page and said, that’s me.", name: "Lina" },
                { quote: "Bedtime got quieter. He asked for one more page.", name: "Omar" },
                { quote: "We made one for a birthday. It felt like a real gift.", name: "Sara" },
              ].map((item) => (
                <figure key={item.name} className="bg-white/80 border border-sky-200 rounded-2xl p-6 shadow-sm">
                  <Quote className="w-6 h-6 text-sky-400 mb-3" />
                  <blockquote className="text-blue-800 leading-relaxed">{item.quote}</blockquote>
                  <figcaption className="mt-4 text-sm font-semibold text-blue-500">{item.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
