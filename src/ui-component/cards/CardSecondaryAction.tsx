import { Link } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// assets
import LinkIcon from '@mui/icons-material/Link';

// project imports
import { CardSecondaryActionProps } from 'types/ui-components';

// ==============================|| CARD SECONDARY ACTION ||============================== //

const CardSecondaryAction: FC<CardSecondaryActionProps> = ({ title, link, icon }) => {
  return (
    <CardActions sx={{ justifyContent: 'flex-end' }}>
      <Tooltip title={title || 'Reference'}>
        <IconButton size="small" component={Link} to={link || '#'} target="_blank">
          {icon || <LinkIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </CardActions>
  );
};

export default CardSecondaryAction;