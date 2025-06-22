import { HeroSection } from "@/components/ui/hero-section";

export default function Landing() {
  return (
    <HeroSection
      badge={{
        text: "Welcome to Chatbot Hub",
        action: {
          text: "Learn more",
          href: "/about",
        },
      }}
      title="Build, Manage, and Chat with AI"
      description="Create your own chatbots, upload knowledge, and chat with AI. Get started now!"
      actions={[
        {
          text: "Get Started",
          href: "/dashboard",
          variant: "default",
        },
      ]}
      image={{
        light: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        dark: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
        alt: "Chatbot Hub Preview",
      }}
    />
  );
} 