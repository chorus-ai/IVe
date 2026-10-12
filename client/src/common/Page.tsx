import { forwardRef, type ReactNode, type HTMLAttributes } from "react";

// ----------------------------------------------------------------------

interface PageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  meta?: ReactNode;
}

const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ children, title = "", meta, className = "", ...other }, ref) => (
    <>
      {/* React 19 hoists <title> and <meta> into <head> from anywhere
          in the tree, so no wrapper component and no provider. */}
      <title>{`${import.meta.env.VITE_APP_NAME} | ${title}`}</title>
      {meta}

      <div ref={ref} className={className} {...other}>
        {children}
      </div>
    </>
  )
);

export default Page;
