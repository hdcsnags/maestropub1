import React, { FormHTMLAttributes, PropsWithChildren } from 'react';

type CsrfFormWrapperProps = PropsWithChildren<
  FormHTMLAttributes<HTMLFormElement> & {
    csrfToken?: string | null;
  }
>;

const CsrfFormWrapper: React.FC<CsrfFormWrapperProps> = ({
  csrfToken,
  children,
  ...formProps
}) => {
  return (
    <form {...formProps}>
      {csrfToken ? <input type="hidden" name="_csrf" value={csrfToken} /> : null}
      {children}
    </form>
  );
};

export default CsrfFormWrapper;
