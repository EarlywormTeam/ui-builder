import React from 'react';

interface RowLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
}

const RowLayout = React.forwardRef<HTMLDivElement, React.PropsWithChildren<RowLayoutProps>>(({ children, ...rest }, ref) => {

  const { className, ...otherProps } = rest;
  return (
    <div ref={ref} className={`${className}`} {...otherProps}>
      {children}
    </div>
  );
});

export default RowLayout;
