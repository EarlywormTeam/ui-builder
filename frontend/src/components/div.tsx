import React from 'react';

interface ColLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
}

const Div = React.forwardRef<HTMLDivElement, React.PropsWithChildren<ColLayoutProps>>(({ children, id, ...rest }, ref) => {

  const { className, ...otherProps } = rest;
  return (
    <div ref={ref} className={`${className}`} {...otherProps}>
      {children}
    </div>
  );
});

export default Div;

