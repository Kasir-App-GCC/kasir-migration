// Loads the Moyasar Payment Form (MPF) library once and caches the promise.
// Resolves only once `window.Moyasar` is actually available, so callers can
// init the form immediately without race conditions.
let loadPromise = null;

export function loadMoyasar() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Moyasar) return Promise.resolve(window.Moyasar);
  if (loadPromise) return loadPromise;

  const VERSION = "2.2.10";
  const base = `https://cdn.jsdelivr.net/npm/moyasar-payment-form@${VERSION}/dist`;

  loadPromise = new Promise((resolve, reject) => {
    try {
      // Stylesheet
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${base}/moyasar.css`;
      document.head.appendChild(link);

      // Script
      const script = document.createElement("script");
      script.src = `${base}/moyasar.umd.min.js`;
      script.async = true;
      script.onload = () => {
        if (window.Moyasar) resolve(window.Moyasar);
        else reject(new Error("Moyasar failed to initialize"));
      };
      script.onerror = () => {
        loadPromise = null;
        reject(new Error("Could not load payment form"));
      };
      document.head.appendChild(script);
    } catch (e) {
      loadPromise = null;
      reject(e);
    }
  });

  return loadPromise;
}