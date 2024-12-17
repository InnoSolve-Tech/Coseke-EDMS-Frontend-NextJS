import { toggleSidebar } from '@/utils';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';

export default function Header() {
  return (
    <Sheet
      sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        width: '100vw',
        height: 'var(--Header-height)',
        zIndex: 9998,
        p: 2,
        gap: 1,
        borderBottom: '1px solid',
        boxShadow: 'sm',
      }}
    >
      <IconButton
        onClick={() => toggleSidebar()}
        variant="outlined"
        color="neutral"
        size="sm"
      >
        <MenuRoundedIcon />
      </IconButton>
    </Sheet>
  );
}
