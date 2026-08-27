import React from "react";

// Catches render errors anywhere in the children tree and shows a friendly
// reload screen instead of a blank white page. Wrap the app's root outlet.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const ar = document.documentElement?.dir === "rtl";
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
          <div className="text-5xl">😵</div>
          <h1 className="text-xl font-bold">
            {ar ? "حدث خطأ ما" : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            {ar
              ? "حدث خطأ غير متوقع. حاول إعادة تحميل الصفحة."
              : "An unexpected error occurred. Try reloading the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            {ar ? "إعادة تحميل" : "Reload"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}