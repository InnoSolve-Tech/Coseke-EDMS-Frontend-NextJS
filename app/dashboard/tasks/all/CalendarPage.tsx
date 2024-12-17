"use client";

import { useState, useMemo } from "react";
import { Box, IconButton, Typography, Button, Sheet, Grid } from "@mui/joy";
import { ChevronLeft, ChevronRight, Today } from "@mui/icons-material";
import dayjs from "dayjs";
import { DayEvents } from "@/components/calender";

// Sample events data (unchanged)
const sampleEvents: DayEvents[] = [
  {
    date: "2024-12-04",
    events: [
      {
        id: "1",
        title: "EDMS - Group P",
        startTime: "10:56 am",
        color: "rgba(0, 120, 212, 0.1)",
      },
      {
        id: "2",
        title: "Digitization of Records",
        startTime: "10:14 am",
        color: "rgba(0, 120, 212, 0.1)",
      },
      {
        id: "3",
        title: "Development & Integration",
        startTime: "10:16 am",
        color: "rgba(0, 120, 212, 0.1)",
      },
    ],
  },
  {
    date: "2024-12-02",
    events: [
      {
        id: "4",
        title: "Exim bank",
        startTime: "12:01 pm",
      },
    ],
  },
];

export default function CalendarPage(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const navigateToToday = () => setCurrentDate(dayjs());
  const navigatePreviousMonth = () =>
    setCurrentDate(currentDate.subtract(1, "month"));
  const navigateNextMonth = () => setCurrentDate(currentDate.add(1, "month"));

  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDate = startOfMonth.startOf("week");
    const endDate = endOfMonth.endOf("week");

    const days: dayjs.Dayjs[] = [];
    for (
      let date = startDate;
      date.isBefore(endDate.add(1, "day"));
      date = date.add(1, "day")
    ) {
      days.push(date);
    }
    return days;
  }, [currentDate]);

  const getEventsForDate = (date: dayjs.Dayjs) => {
    return (
      sampleEvents.find(
        (dayEvents) => dayEvents.date === date.format("YYYY-MM-DD"),
      )?.events || []
    );
  };

  return (
    <Box
      sx={{ p: 2, height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          p: 2,
          backgroundColor: "background.level1",
          borderRadius: "sm",
          boxShadow: "sm",
        }}
      >
        <Typography level="h3" fontWeight="bold">
          {currentDate.format("MMMM YYYY")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="soft"
            color="primary"
            startDecorator={<Today />}
            onClick={navigateToToday}
          >
            Today
          </Button>
          <IconButton
            variant="soft"
            color="neutral"
            onClick={navigatePreviousMonth}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            variant="soft"
            color="neutral"
            onClick={navigateNextMonth}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Sheet
        variant="outlined"
        sx={{
          flex: 1,
          borderRadius: "sm",
          overflow: "hidden",
        }}
      >
        {/* Weekday Headers */}
        <Grid
          container
          columns={7}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Grid
              key={day}
              xs={1}
              sx={{
                p: 1.5,
                textAlign: "center",
                borderRight: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.level2",
                "&:last-child": {
                  borderRight: "none",
                },
              }}
            >
              <Typography level="body-sm" fontWeight="lg">
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Days */}
        <Grid container columns={7} sx={{ flexGrow: 1 }}>
          {calendarDays.map((date) => {
            const isToday = date.isSame(dayjs(), "day");
            const events = getEventsForDate(date);
            const isCurrentMonth = date.isSame(currentDate, "month");

            return (
              <Grid
                key={date.toString()}
                xs={1}
                sx={{
                  p: 1,
                  borderRight: "1px solid",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  backgroundColor: isToday
                    ? "primary.softBg"
                    : "background.body",
                  color: isCurrentMonth ? "text.primary" : "text.tertiary",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  "&:nth-of-type(7n)": {
                    borderRight: "none",
                  },
                  "&:last-child": {
                    borderBottom: "none",
                  },
                }}
              >
                <Typography
                  level="body-sm"
                  fontWeight={isToday ? "lg" : "md"}
                  sx={{ mb: 1 }}
                >
                  {date.format("D")}
                </Typography>
                <Box sx={{ overflow: "auto", flexGrow: 1 }}>
                  {events.map((event) => (
                    <Box
                      key={event.id}
                      sx={{
                        backgroundColor: event.color || "primary.softBg",
                        borderRadius: "sm",
                        p: 1,
                        mb: 0.5,
                        cursor: "pointer",
                        boxShadow: "xs",
                        "&:hover": {
                          opacity: 0.9,
                        },
                      }}
                    >
                      <Typography
                        level="body-xs"
                        sx={{ color: "primary.softColor" }}
                      >
                        {event.startTime}
                      </Typography>
                      <Typography level="body-sm" noWrap>
                        {event.title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Sheet>
    </Box>
  );
}
