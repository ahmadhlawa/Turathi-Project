export default function Footer() {
  return (
    <footer className="w-full h-10 border-t border-bg-overlay bg-bg-deep flex items-center justify-between px-8 text-[10px] text-text-muted z-50 font-cairo">
      <span>تراثي الرقمي — حماية السردية والتاريخ الفلسطيني. جميع الحقوق محفوظة &copy; {new Date().getFullYear()}</span>
      <span>مدعوم بتقنية Gemini 2.0 AI</span>
    </footer>
  );
}
