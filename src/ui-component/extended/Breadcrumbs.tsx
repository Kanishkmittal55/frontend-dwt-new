import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { FC } from 'react';

// material-ui
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import { Card, Divider, Grid, Typography } from '@mui/material';

// project imports
import { gridSpacing } from 'store/constant';
import { BreadcrumbsProps } from 'types/ui-components';

// assets
import { IconTallymark1 } from '@tabler/icons-react';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import HomeIcon from '@mui/icons-material/Home';
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone';

// ==============================|| BREADCRUMBS ||============================== //

const Breadcrumbs: FC<BreadcrumbsProps> = ({
  card = false,
  divider = true,
  icon = true,
  icons = false,
  maxItems = 8,
  navigation,
  rightAlign = true,
  separator = IconTallymark1,
  title = true,
  titleBottom = true,
  ...others
}) => {
  const location = useLocation();
  const [main, setMain] = useState<any>();
  const [item, setItem] = useState<any>();

  // set active item state
  const getCollapse = (menu: any) => {
    if (menu.children) {
      menu.children.filter((collapse: any) => {
        if (collapse.type && collapse.type === 'collapse') {
          getCollapse(collapse);
        } else if (collapse.type && collapse.type === 'item') {
          if (location.pathname === collapse.url) {
            setMain(menu);
            setItem(collapse);
          }
        }
        return false;
      });
    }
  };

  useEffect(() => {
    navigation?.items?.map((menu: any) => {
      if (menu.type && menu.type === 'group') {
        getCollapse(menu);
      }
      return false;
    });
  });

  // item separator
  const SeparatorIcon = separator;
  const separatorIcon = separator ? <SeparatorIcon stroke={1.5} size="1rem" /> : '/';

  let mainContent;
  let itemContent;
  let breadcrumbContent = <Typography />;
  let itemTitle = '';
  let CollapseIcon;
  let ItemIcon;

  // collapse item
  if (main && main.type === 'collapse') {
    CollapseIcon = main.icon ? main.icon : AccountTreeTwoToneIcon;
    mainContent = (
      <Typography component={Link} to="#" variant="subtitle1" sx={{ textDecoration: 'none' }}>
        {icons && <CollapseIcon style={{ marginRight: 8, marginTop: -2, width: 16, height: 16, color: 'inherit' }} />}
        {main.title}
      </Typography>
    );
  }

  // items
  if (item && item.type === 'item') {
    itemTitle = item.title;

    ItemIcon = item.icon ? item.icon : AccountTreeTwoToneIcon;
    itemContent = (
      <Typography
        variant="subtitle1"
        sx={{
          display: 'flex',
          textDecoration: 'none',
          alignContent: 'center',
          alignItems: 'center',
          color: 'grey.500'
        }}
      >
        {icons && <ItemIcon style={{ marginRight: 8, marginTop: -2, width: 16, height: 16, color: 'inherit' }} />}
        {itemTitle}
      </Typography>
    );

    // main
    if (item.breadcrumbs !== false) {
      breadcrumbContent = (
        <Card
          sx={{
            marginBottom: card === false ? 0 : gridSpacing,
            border: card === false ? 'none' : '1px solid',
            borderColor: 'primary.light',
            background: card === false ? 'transparent' : 'background.default'
          }}
          {...others}
        >
          <Grid
            container
            direction={rightAlign ? 'row' : 'column'}
            justifyContent={rightAlign ? 'space-between' : 'flex-start'}
            alignItems={rightAlign ? 'center' : 'flex-start'}
            sx={{ p: card === false ? 0 : 1, pl: card === false ? 0 : 2 }}
          >
            <Grid item>
              <MuiBreadcrumbs
                sx={{ '& .MuiBreadcrumbs-separator': { width: 16, ml: 1.25, mr: 1.25 } }}
                aria-label="breadcrumb"
                maxItems={maxItems || 8}
                separator={separatorIcon}
              >
                <Typography component={Link} to="/" color="inherit" variant="subtitle1" sx={{ textDecoration: 'none' }}>
                  {icons && <HomeTwoToneIcon sx={{ mr: 0.75, width: 16, height: 16 }} />}
                  {icon && !icons && <HomeIcon sx={{ mr: 0.75, width: 16, height: 16 }} />}
                  {(!icon || icons) && 'Dashboard'}
                </Typography>
                {mainContent}
                {itemContent}
              </MuiBreadcrumbs>
            </Grid>
            {title && titleBottom && (
              <Grid item sx={{ mb: card === false ? 0 : 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  {item.title}
                </Typography>
              </Grid>
            )}
          </Grid>
          {card === false && divider !== false && <Divider sx={{ borderColor: 'primary.light', mb: gridSpacing }} />}
        </Card>
      );
    }
  }

  return breadcrumbContent;
};

export default Breadcrumbs;