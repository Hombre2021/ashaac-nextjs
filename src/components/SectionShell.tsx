import type { ReactNode } from "react";

type SectionShellProps = {
  sectionClassName: string;
  titleClassName: string;
  listClassName: string;
  title: string;
  children: ReactNode;
};

export default function SectionShell({
  sectionClassName,
  titleClassName,
  listClassName,
  title,
  children,
}: SectionShellProps) {
  return (
    <section className={sectionClassName}>
      <h2 className={titleClassName}>{title}</h2>
      <div className={listClassName}>{children}</div>
    </section>
  );
}
