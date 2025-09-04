import PropTypes from 'prop-types';
// material-ui
import { experimentalStyled as styled } from '@mui/material/styles';
import MuiInputLabel from '@mui/material/InputLabel';
import type { WithChildren } from 'types/utilities';

interface InputLabelProps extends WithChildren {
  horizontal?: boolean;
  [key: string]: any;
}

const BInputLabel = styled((props: any) => <MuiInputLabel {...props} />, {
  shouldForwardProp: (prop) => prop !== 'horizontal'
})(({ theme, horizontal }: { theme: any; horizontal?: boolean }) => ({
  color: theme.palette.text.primary,
  fontWeight: 500,
  marginBottom: horizontal ? 0 : 8
}));

export default function InputLabel({ children, horizontal = false, ...others }: InputLabelProps) {
  return (
    <BInputLabel horizontal={horizontal} {...others}>
      {children}
    </BInputLabel>
  );
}