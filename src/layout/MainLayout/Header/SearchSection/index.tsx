import { useState } from 'react';
import type { FC } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  ButtonBase,
  Card,
  Grid,
  InputAdornment,
  OutlinedInput,
  Popper,
  Typography
} from '@mui/material';

// third-party
import PopupState, { bindPopper, bindToggle } from 'material-ui-popup-state';

// project imports
import Transitions from 'ui-component/extended/Transitions';

// assets
import { IconAdjustmentsHorizontal, IconSearch, IconX } from '@tabler/icons-react';

interface HeaderAvatarComponentProps {
  children: React.ReactNode;
  [key: string]: any;
}

const HeaderAvatarComponent: FC<HeaderAvatarComponentProps> = ({ children, ...others }) => {
  const theme = useTheme();

  return (
    <Avatar
      sx={{
        ...theme.typography.mediumAvatar,
        transition: 'all .2s ease-in-out',
        background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.secondary.light,
        color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.dark,
        '&[aria-controls="menu-list-grow"],&:hover': {
          background: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.dark,
          color: theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.light
        }
      }}
      {...others}
    >
      {children}
    </Avatar>
  );
};

const HeaderAvatar = HeaderAvatarComponent;

// ==============================|| SEARCH INPUT - MOBILE||============================== //

interface MobileSearchProps {
  value: string;
  setValue: (value: string) => void;
  popupState: any;
}

const MobileSearch: FC<MobileSearchProps> = ({ value, setValue, popupState }) => {
  const theme = useTheme();

  return (
    <OutlinedInput
      id="input-search-header"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search"
      startAdornment={
        <InputAdornment position="start">
          <IconSearch stroke={1.5} size="16px" color={theme.palette.grey[500]} />
        </InputAdornment>
      }
      endAdornment={
        <InputAdornment position="end">
          <ButtonBase sx={{ borderRadius: '12px' }}>
            <HeaderAvatar>
              <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
            </HeaderAvatar>
          </ButtonBase>
          <Box sx={{ ml: 2 }}>
            <ButtonBase sx={{ borderRadius: '12px' }}>
              <Avatar
                variant="rounded"
                sx={{
                  ...theme.typography.commonAvatar,
                  ...theme.typography.mediumAvatar,
                  background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.orange.light,
                  color: theme.palette.orange.dark,
                  '&:hover': {
                    background: theme.palette.orange.dark,
                    color: theme.palette.orange.light
                  }
                }}
                {...bindToggle(popupState)}
              >
                <IconX stroke={1.5} size="20px" />
              </Avatar>
            </ButtonBase>
          </Box>
        </InputAdornment>
      }
      aria-describedby="search-helper-text"
      inputProps={{ 'aria-label': 'weight' }}
      sx={{ width: '100%', ml: 0.5, px: 2, bgcolor: 'background.paper' }}
    />
  );
};

// ==============================|| SEARCH INPUT ||============================== //

const SearchSection: FC = () => {
  const theme = useTheme();
  const [value, setValue] = useState('');

  return (
    <>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <PopupState variant="popper" popupId="demo-popup-popper">
          {(popupState) => (
            <>
              <Box sx={{ ml: 2 }}>
                <ButtonBase sx={{ borderRadius: '12px' }}>
                  <HeaderAvatar {...bindToggle(popupState)}>
                    <IconSearch stroke={1.5} size="19.2px" />
                  </HeaderAvatar>
                </ButtonBase>
              </Box>
              <Popper
                {...bindPopper(popupState)}
                transition
                sx={{ zIndex: 1100, width: '99%', top: '-55px !important', px: { xs: 1.25, sm: 1.5 } }}
              >
                {({ TransitionProps }) => (
                  <>
                    <Transitions type="zoom" {...TransitionProps} sx={{ transformOrigin: 'center left' }}>
                      <Card
                        sx={{
                          background: '#fff',
                          [theme.breakpoints.down('sm')]: {
                            border: 0,
                            boxShadow: 'none'
                          }
                        }}
                      >
                        <Box sx={{ p: 2 }}>
                          <Grid container alignItems="center" justifyContent="space-between">
                            <Grid item xs>
                              <MobileSearch value={value} setValue={setValue} popupState={popupState} />
                            </Grid>
                          </Grid>
                        </Box>
                      </Card>
                    </Transitions>
                  </>
                )}
              </Popper>
            </>
          )}
        </PopupState>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <OutlinedInput
          id="input-search-header"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search"
          startAdornment={
            <InputAdornment position="start">
              <IconSearch stroke={1.5} size="16px" />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <ButtonBase sx={{ borderRadius: '12px' }}>
                <HeaderAvatar>
                  <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
                </HeaderAvatar>
              </ButtonBase>
            </InputAdornment>
          }
          aria-describedby="search-helper-text"
          inputProps={{ 'aria-label': 'weight' }}
          sx={{ width: { md: 250, lg: 434 }, ml: 2, px: 2 }}
        />
      </Box>
    </>
  );
};

export default SearchSection;