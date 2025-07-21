import React, { useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Text } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedModal } from '@/components/ThemedModal';
import { ThemedView } from '@/components/ThemedView';
import { CalendarEvent, useDatabase } from '@/hooks/useDatabase';

interface EventSection {
  title: string;
  data: CalendarEvent[];
}

export default function HomeScreen() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { events, deleteEvent } = useDatabase();

  // Transform events data into sections format
  const sections: EventSection[] = useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    // Group events by date
    const groupedEvents: { [key: string]: CalendarEvent[] } = {};

    events.forEach(event => {
      const eventDate = new Date(event.event_date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let dateKey: string;

      // Format date display
      if (eventDate.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (eventDate.toDateString() === tomorrow.toDateString()) {
        dateKey = 'Tomorrow';
      } else {
        dateKey = eventDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    // Convert to sections format and sort by date
    return Object.keys(groupedEvents)
      .map(dateKey => ({
        title: dateKey,
        data: groupedEvents[dateKey].sort((a, b) => a.event_time.localeCompare(b.event_time))
      }))
      .sort((a, b) => {
        // Sort sections by actual date
        const getDateValue = (title: string) => {
          if (title === 'Today') return 0;
          if (title === 'Tomorrow') return 1;
          return new Date(title).getTime();
        };
        return getDateValue(a.title) - getDateValue(b.title);
      });
  }, [events]);

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent?.event_id) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(selectedEvent.event_id!);
              handleCloseModal();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleEditEvent = () => {
    // TODO: Implement edit functionality
    // For now, close modal and potentially navigate to calendar tab
    handleCloseModal();
    Alert.alert('Edit Event', 'Edit functionality coming soon!');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work': return '#2196F3';
      case 'personal': return '#4CAF50';
      case 'family': return '#FF9800';
      case 'friends': return '#9C27B0';
      default: return '#607D8B';
    }
  };

  const renderItem = ({ item }: { item: CalendarEvent }) => {
    return (
      <Card style={styles.eventCard} onPress={() => handleEventPress(item)}>
        <Card.Content>
          <View style={styles.eventHeader}>
            <Text variant="titleMedium" style={styles.eventTitle}>
              {item.event_name}
            </Text>
            <Chip
              style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
              textStyle={styles.categoryText}
            >
              {item.category}
            </Chip>
          </View>
          <Text variant="bodyMedium" style={styles.eventTime}>
            {formatTime(item.event_time)}
          </Text>
          {item.description && (
            <Text variant="bodySmall" style={styles.eventDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderSectionHeader = ({ section }: { section: EventSection }) => (
    <Text variant="headlineSmall" style={styles.sectionHeaderText}>
      {section.title}
    </Text>
  );

  const renderListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineMedium" style={styles.emptyText}>
        No events yet! 😼
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtext}>
        Add your first event using the calendar tab
      </Text>
    </View>
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SectionList
          style={styles.sectionList}
          ListHeaderComponent={() => (
            <Text variant="headlineLarge" style={styles.headerText}>
              Moshi Schedules
            </Text>
          )}
          ListEmptyComponent={renderListEmpty}
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => `${item.event_id}-${item.event_name}`}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={sections.length === 0 ? styles.emptyContentContainer : undefined}
        />

        <ThemedModal
          transparent={true}
          animationType="fade"
          visible={modalVisible}
          onRequestClose={handleCloseModal}
          onDismiss={handleCloseModal}
        >
          <View style={styles.modalContainer}>
            <ThemedView style={styles.modalView}>
              {selectedEvent && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleContainer}>
                      <Text variant="headlineSmall" style={styles.modalTitle}>
                        {selectedEvent.event_name}
                      </Text>
                      <Chip
                        style={[styles.categoryChip, { backgroundColor: getCategoryColor(selectedEvent.category) }]}
                        textStyle={styles.categoryText}
                      >
                        {selectedEvent.category}
                      </Chip>
                    </View>
                    <View style={styles.modalActions}>
                      <IconButton
                        icon="pencil"
                        size={24}
                        iconColor="white"
                        onPress={handleEditEvent}
                        style={styles.actionIcon}
                      />
                      <IconButton
                        icon="trash-can"
                        size={24}
                        iconColor="#FF6B6B"
                        onPress={handleDeleteEvent}
                        style={styles.actionIcon}
                      />
                      <IconButton
                        icon="close"
                        size={24}
                        iconColor="white"
                        onPress={handleCloseModal}
                        style={styles.actionIcon}
                      />
                    </View>
                  </View>

                  <View style={styles.modalContent}>
                    <View style={styles.detailRow}>
                      <Text variant="titleMedium" style={styles.detailLabel}>Date:</Text>
                      <Text variant="bodyLarge" style={styles.detailValue}>
                        {new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text variant="titleMedium" style={styles.detailLabel}>Time:</Text>
                      <Text variant="bodyLarge" style={styles.detailValue}>
                        {formatTime(selectedEvent.event_time)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text variant="titleMedium" style={styles.detailLabel}>Alarm:</Text>
                      <Text variant="bodyLarge" style={styles.detailValue}>
                        {selectedEvent.notif_time}
                      </Text>
                    </View>

                    {selectedEvent.description && (
                      <View style={styles.descriptionContainer}>
                        <Text variant="titleMedium" style={styles.detailLabel}>Description:</Text>
                        <Text variant="bodyMedium" style={styles.description}>
                          {selectedEvent.description}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ThemedView>
          </View>
        </ThemedModal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D3D47',
  },
  sectionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 20,
  },
  sectionHeaderText: {
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  eventCard: {
    marginVertical: 4,
    marginHorizontal: 8,
    backgroundColor: 'white',
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    color: '#888',
    fontStyle: 'italic',
  },
  categoryChip: {
    height: 28,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#ccc',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1D3D47',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    margin: 0,
    marginLeft: 4,
  },
  modalContent: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    color: 'white',
    fontWeight: 'bold',
    width: 80,
  },
  detailValue: {
    color: '#ccc',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    color: '#ccc',
    marginTop: 4,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 8,
  },
});
