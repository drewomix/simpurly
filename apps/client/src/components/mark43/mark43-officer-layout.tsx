import * as React from "react";
import { classNames } from "lib/classNames";

interface Mark43OfficerLayoutProps {
  title: string;
  children: React.ReactNode;
  label?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  contentClassName?: string;
  disablePrimaryPanel?: boolean;
}

export function Mark43OfficerLayout({
  title,
  label = "MARK43 CAD",
  subtitle,
  actions,
  toolbar,
  children,
  contentClassName,
  disablePrimaryPanel,
}: Mark43OfficerLayoutProps) {
  return (
    <div className="mark43-cad mark43-cad--officer-subpage">
      <header className="mark43-cad__header mark43-cad__header--subpage">
        <div className="mark43-cad__brand">
          <p className="mark43-cad__brand-label">{label}</p>
          <h1 className="mark43-cad__brand-title">{title}</h1>
          {subtitle ? <p className="mark43-cad__brand-subtitle">{subtitle}</p> : null}
        </div>

        {actions ? <div className="mark43-cad__actions">{actions}</div> : null}
      </header>

      {toolbar ? <div className="mark43-cad__toolbar">{toolbar}</div> : null}

      <div className={classNames("mark43-cad__shell mark43-cad__shell--single", contentClassName)}>
        {disablePrimaryPanel ? (
          children
        ) : (
          <div className="mark43-cad__panel mark43-cad__panel--primary">{children}</div>
        )}
      </div>
    </div>
  );
}
