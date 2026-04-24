export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>تراثي الرقمي - منصة لحماية السردية والذاكرة الفلسطينية. © {new Date().getFullYear()}</span>
        <span>تجربة بحثية مقدمة لـ AI Week Palestine</span>
      </div>
    </footer>
  );
}
