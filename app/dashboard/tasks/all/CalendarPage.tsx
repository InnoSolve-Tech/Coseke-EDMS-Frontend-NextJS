"use client";

import React, { useState } from 'react';
import { Box, Grid, Typography, IconButton, Card } from '@mui/joy';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import dayjs from 'dayjs';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf('month').day();

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <IconButton onClick={handlePreviousMonth}>
          <ChevronLeft />
        </IconButton>
        <Typography level="h4">
          {currentMonth.format('MMMM YYYY')}
        </Typography>
        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      <Card variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid xs={1.5} key={day}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {day}
              </Box>
            </Grid>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <Grid xs={1.5} key={`empty-${index}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => (
            <Grid xs={1.5} key={`day-${index + 1}`}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {index + 1}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default CalendarPage;
