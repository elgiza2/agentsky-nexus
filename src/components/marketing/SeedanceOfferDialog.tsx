import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useUserLang } from "@/lib/authI18n";
import MegsyStar from "@/components/branding/MegsyStar";

const SESSION_KEY = "megsy_offers_carousel_seen_v11";
const AUTOPLAY_MS = 4200;

type OfferFeature = { title: string; titleAr: string; sub: string; subAr: string };

type Offer = {
  id: string;
  image: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  features: OfferFeature[];
};

const OFFERS: Offer[] = [
  {
    id: "gpt_25",
    image: "/offer-gpt-25.jpg",
    title: "GPT 2.5 Unlimited",
    titleAr: "GPT 2.5 بلا حدود",
    body: "Use our flagship model without limits for a full month.",
    bodyAr: "استخدم أقوى نماذجنا بلا حدود لمدة شهر كامل.",
    features: [
      { title: "Unlimited chats", titleAr: "محادثات بلا حدود", sub: "No message caps for a full month", subAr: "بدون حدود للرسائل لمدة شهر كامل" },
      { title: "Faster responses", titleAr: "ردود أسرع", sub: "Priority speed on every request", subAr: "سرعة أعلى في كل طلب" },
      { title: "Priority access", titleAr: "أولوية الوصول", sub: "New models reach you first", subAr: "النماذج الجديدة توصلك الأول" },
    ],
  },
  {
    id: "computer",
    image: "/offer-computer-25.jpg",
    title: "Megsy Computer",
    titleAr: "ميغسي كومبيوتر",
    body: "Let Megsy browse, click, research and get work done for you.",
    bodyAr: "خلّي ميغسي يتصفح ويبحث وينفذ المهام بدلًا منك.",
    features: [
      { title: "Browses the web for you", titleAr: "يتصفح الويب بدلًا منك", sub: "Opens sites and gathers what you need", subAr: "يفتح المواقع ويجمع اللي محتاجه" },
      { title: "Clicks and types", titleAr: "يضغط ويكتب", sub: "Fills forms and completes steps", subAr: "يملأ النماذج ويكمّل الخطوات" },
      { title: "Delivers finished work", titleAr: "يسلّم شغل مكتمل", sub: "Research, files and results ready", subAr: "بحث وملفات ونتائج جاهزة" },
    ],
  },
  {
    id: "agent",
    image: "/offer-agent-25.jpg",
    title: "Megsy Agent",
    titleAr: "وكيل ميغسي",
    body: "Turn complex goals into finished work with an autonomous AI agent.",
    bodyAr: "حوّل المهام المعقدة إلى شغل مكتمل مع وكيل ذكاء اصطناعي مستقل.",
    features: [
      { title: "Turns goals into plans", titleAr: "يحوّل أهدافك لخطط", sub: "Breaks big tasks into clear steps", subAr: "يقسّم المهام الكبيرة لخطوات واضحة" },
      { title: "Works autonomously", titleAr: "يشتغل بشكل مستقل", sub: "Keeps going until the job is done", subAr: "يكمّل لوحده لحد ما الشغل يخلص" },
      { title: "Finishes complex tasks", titleAr: "ينهي المهام المعقدة", sub: "Multi-step work, handled end to end", subAr: "شغل متعدد الخطوات من الأول للآخر" },
    ],
  },
];

export default function SeedanceOfferDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const lang = useUserLang();
  const isArabic = lang === "ar-eg";
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const isEntryRoute = location.pathname === "/" || location.pathname === "/chat" || location.pathname === "/index";
    if (!isEntryRoute) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => { setDir(1); setActiveIndex((index) => (index + 1) % OFFERS.length); }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [open]);

  // Preload the next slide's image while the current one is showing.
  useEffect(() => {
    if (!open) return;
    const next = OFFERS[(activeIndex + 1) % OFFERS.length];
    const img = new Image();
    img.src = next.image;
  }, [open, activeIndex]);

  const dismiss = () => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* storage unavailable */ }
    setOpen(false);
  };

  const tryNow = () => {
    const offer = OFFERS[activeIndex];
    dismiss();
    navigate(offer.id === "computer" || offer.id === "agent" ? "/chat" : `/pricing?offer=${offer.id}`);
  };

  const move = (direction: 1 | -1) => setActiveIndex((index) => (index + direction + OFFERS.length) % OFFERS.length);
  const current = OFFERS[activeIndex];

  const [dir, setDir] = useState<1 | -1>(1);
  const go = (index: number) => { setDir(index > activeIndex ? 1 : -1); setActiveIndex(index); };
  const slide = {
    enter: (d: number) => ({ opacity: 0, x: d * 36 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -36 }),
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : dismiss())}>
      <DialogContent
        dir={isArabic ? "rtl" : "ltr"}
        onOpenAutoFocus={(event) => event.preventDefault()}
        overlayClassName="hidden"
        className="offers-bottom-sheet fixed bottom-0 left-1/2 top-auto z-50 block max-h-[92dvh] w-full max-w-[520px] translate-x-[-50%] translate-y-0 overflow-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-t-[28px] rounded-b-none !border-0 bg-background p-0 text-foreground shadow-[0_-18px_60px_hsl(var(--foreground)/0.18)] !outline-none !ring-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 [&_button]:outline-none [&>button]:hidden"
      >
        {/* Full-bleed image — no frame or border above it */}
        <div
          className="relative aspect-[5/3] w-full overflow-hidden bg-foreground touch-pan-y"
          onPointerDown={(event) => { touchStartX.current = event.clientX; }}
          onPointerUp={(event) => {
            if (touchStartX.current === null) return;
            const delta = event.clientX - touchStartX.current;
            if (Math.abs(delta) > 42) { const d = delta > 0 ? -1 : 1; setDir(d); move(d); }
            touchStartX.current = null;
          }}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.img
              key={current.image}
              src={current.image}
              alt={isArabic ? current.titleAr : current.title}
              width={1280}
              height={768}
              draggable={false}
              custom={dir}
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-x-0 top-2.5 mx-auto h-1 w-10 rounded-full bg-background/70" />
        </div>

        <div className="px-6 pb-7 pt-5 sm:px-8">
          <AnimatePresence initial={false} custom={dir} mode="wait">
            <motion.div
              key={current.id}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <DialogTitle
                className="text-center text-[26px] leading-8 tracking-tight"
                style={{ fontFamily: '"Instrument Serif", "ITC Garamond Std Narrow", Georgia, serif', fontWeight: 400 }}
              >
                {isArabic ? current.titleAr : current.title}
              </DialogTitle>
              <DialogDescription className="mx-auto mt-2 max-w-[380px] text-center text-[13.5px] leading-6 text-muted-foreground">
                {isArabic ? current.bodyAr : current.body}
              </DialogDescription>

              <ul className="mx-auto mt-6 flex max-w-[360px] flex-col gap-4">
                {current.features.map((feature, i) => (
                  <motion.li
                    key={feature.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i + 0.08, duration: 0.3 }}
                    className="flex items-center gap-3.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground">
                      <MegsyStar className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold leading-5 tracking-[-0.01em]">{isArabic ? feature.titleAr : feature.title}</span>
                      <span className="mt-0.5 block text-[12.5px] leading-5 text-muted-foreground">{isArabic ? feature.subAr : feature.sub}</span>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-1.5" dir="ltr">
            {OFFERS.map((offer, index) => (
              <div
                key={offer.id}
                role="button"
                tabIndex={0}
                aria-label={offer.title}
                onClick={() => go(index)}
                style={{ width: index === activeIndex ? 22 : 6, height: 6 }}
                className={`cursor-pointer rounded-full transition-all duration-300 ${index === activeIndex ? "bg-foreground" : "bg-foreground/20"}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={(event) => { event.currentTarget.blur(); tryNow(); }}
            className="btn-sunset mt-5 h-[52px] w-full text-[15px] font-bold"
          >
            {isArabic ? "جرّب الآن" : "Try now"}
          </button>
          <button
            type="button"
            onPointerDown={(event) => { event.preventDefault(); dismiss(); }}
            onClick={dismiss}
            className="mt-2 h-11 w-full rounded-full text-[14px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            {isArabic ? "لاحقًا" : "Later"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
