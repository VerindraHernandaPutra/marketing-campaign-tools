import React, { useEffect, useState } from 'react';
import { Paper, Box, Loader } from '@mantine/core';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    platforms: string[];
    status: string;
  };
}

const ScheduledCalendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to assign colors based on platform
  const getPlatformColor = (platforms: string[]) => {
    if (platforms.includes('whatsapp')) return '#25D366';
    if (platforms.includes('instagram')) return '#E4405F';
    if (platforms.includes('facebook')) return '#1877F2';
    if (platforms.includes('email')) return '#EA4335';
    if (platforms.includes('twitter')) return '#1DA1F2';
    return '#888888'; // Default gray
  };

  useEffect(() => {
    const fetchScheduledCampaigns = async () => {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id, title, scheduled_date, platforms, status')
        .eq('user_id', user.id)
        .not('scheduled_date', 'is', null); // Only get scheduled items

      if (error) {
        console.error('Error fetching calendar events:', error);
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedEvents: CalendarEvent[] = data.map((campaign: any) => ({
          id: campaign.id,
          title: `${campaign.title} (${campaign.platforms?.[0] || 'General'})`,
          start: campaign.scheduled_date,
          backgroundColor: getPlatformColor(campaign.platforms || []),
          borderColor: getPlatformColor(campaign.platforms || []),
          extendedProps: {
            platforms: campaign.platforms,
            status: campaign.status
          }
        }));
        setEvents(formattedEvents);
      }
      setLoading(false);
    };

    fetchScheduledCampaigns();
  }, [user]);

  const handleEventClick = (info: EventClickArg) => {
    // Navigate to edit page when clicked
    navigate(`/campaign-manager/edit/${info.event.id}`);
  };

  if (loading) {
    return (
      <Paper shadow="sm" p="xl" style={{ minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="xl">
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
          editable={false} // Set to true if you implement drag-and-drop rescheduling later
          selectable={true} 
        />
      </Box>
    </Paper>
  );
};

export default ScheduledCalendar;