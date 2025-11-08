import React from 'react'; // 'useState' dihapus karena tidak terpakai
import { Paper, Box } from '@mantine/core';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const ScheduledCalendar: React.FC = () => {
  const events = [{
    id: '1',
    title: 'Summer Sale - Facebook',
    start: '2024-01-15T10:00:00',
    backgroundColor: '#1877F2'
  }, {
    id: '2',
    title: 'Product Launch - Instagram',
    start: '2024-01-16T14:00:00',
    backgroundColor: '#E4405F'
  }, {
    id: '3',
    title: 'Newsletter - Email',
    start: '2024-01-18T09:00:00',
    backgroundColor: '#EA4335'
  }, {
    id: '4',
    title: 'Update - Twitter',
    start: '2024-01-20T16:00:00',
    backgroundColor: '#1DA1F2'
  }];

  // Tipe 'EventClickArg' sekarang diimpor dengan benar
  const handleEventClick = (info: EventClickArg) => {
    console.log('Event clicked:', info.event);
  };

  return <Paper shadow="sm" p="xl">
      <Box className="calendar-container">
        <FullCalendar 
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} 
          initialView="dayGridMonth" 
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }} 
          events={events} 
          eventClick={handleEventClick} 
          height="auto" 
          editable={true} 
          selectable={true} 
        />
      </Box>
    </Paper>;
};

export default ScheduledCalendar;