import { forwardRef } from 'react';
import type { Ref } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

// project imports
import { SubCardProps } from 'types/ui-components';

// ==============================|| CUSTOM SUB CARD COMPONENT ||============================== //

const SubCard = forwardRef<HTMLDivElement, SubCardProps>(
  (
    {
      children,
      content = true,
      contentClass = '',
      darkTitle,
      secondary,
      sx = {},
      contentSX = {},
      title,
      ...others
    },
    ref: Ref<HTMLDivElement>
  ) => {
    const theme = useTheme();

    return (
      <Card
        ref={ref}
        sx={{
          border: '1px solid',
          borderColor: theme.palette.grey[300],
          ':hover': {
            boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
          },
          ...sx
        }}
        {...others}
      >
        {/* card header and action */}
        {!darkTitle && title && (
          <CardHeader sx={{ p: 2.5 }} title={<Typography variant="h4">{title}</Typography>} action={secondary} />
        )}
        {darkTitle && title && (
          <CardHeader sx={{ p: 2.5 }} title={<Typography variant="h3">{title}</Typography>} action={secondary} />
        )}

        {/* content & header divider */}
        {title && <Divider />}

        {/* card content */}
        {content && (
          <CardContent sx={{ p: 2.5, ...contentSX }} className={contentClass}>
            {children}
          </CardContent>
        )}
        {!content && children}
      </Card>
    );
  }
);

SubCard.displayName = 'SubCard';

export default SubCard;