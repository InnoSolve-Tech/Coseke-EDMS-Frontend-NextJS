import { Box, Typography } from "@mui/joy"
import { CalendarEvent } from "../../components/calender"

interface CalendarEventProps {
  event: CalendarEvent
}

export function CalendarEventItem({ event }: CalendarEventProps) {
  return (
    <Box
      sx={{
        backgroundColor: event.color || "primary.softBg",
        borderRadius: "sm",
        p: 1,
        mb: 0.5,
        cursor: "pointer",
        "&:hover": {
          opacity: 0.9,
        },
      }}
    >
      <Typography level="body-xs" sx={{ color: "primary.softColor" }}>
        {event.startTime}
      </Typography>
      <Typography level="body-sm" noWrap>
        {event.title}
      </Typography>
    </Box>
  )
}

