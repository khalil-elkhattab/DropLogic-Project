"use client";
import { ClerkProvider } from "@clerk/clerk-react";

export default function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        // هذا الجزء سيجعل كل شيء باللون الأسود والأبيض تماماً
        variables: {
          colorPrimary: "#000000",      // الأزرار الأساسية سوداء
          colorText: "#1a1a1a",         // النصوص غامقة
          colorBackground: "#ffffff",    // الخلفية بيضاء نقية
          borderRadius: "12px",         // حواف دائرية مثل أزرار موقعك
          fontFamily: "inherit",         // يستخدم نفس خط موقعك
        },
        elements: {
          // تخصيص الأزرار والعناصر بدقة
          formButtonPrimary: "bg-black hover:bg-gray-800 border-none",
          card: "shadow-2xl border border-gray-100",
          footerActionLink: "text-blue-600 hover:text-blue-700",
          identityPreviewEditButtonIcon: "text-black",
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}