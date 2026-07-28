import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#08120C] px-5 py-10 text-[13px] leading-6 text-[#9AA69D]">
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 font-medium text-[#F6F2E9]">이루리</p>
        <p>우베르(UBERE) | 대표 박용철</p>
        <p>충청남도 천안시 서북구 두정상가3길 33, 2층 267호(두정동)</p>
        <p>
          전화 <a href="tel:01062973953">010-6297-3953</a> | 이메일{" "}
          <a href="mailto:uberekorea@gmail.com">uberekorea@gmail.com</a>
        </p>
        <p>사업자등록번호 171-54-00741</p>
        <p>통신판매업신고번호 2024-충남천안-2104</p>
        <nav className="mt-4 flex flex-wrap gap-4">
          <Link href="/terms">이용약관</Link>
          <Link className="font-semibold text-[#F6F2E9]" href="/privacy">
            개인정보처리방침
          </Link>
          <Link href="/refund">환불정책</Link>
        </nav>
        <p className="mt-4">© 2026 우베르(UBERE). All rights reserved.</p>
      </div>
    </footer>
  );
}
