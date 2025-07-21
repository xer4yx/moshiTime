import React, { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedModal } from "@/components/ThemedModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";
import { CalendarTimePicker } from "@/components/ui/CalendarTimePicker";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { CalendarEvent, useDatabase } from "@/hooks/useDatabase";
import { useNotifications } from "@/hooks/useNotifications";

export default function CalendarScreen() {
    const [alarm, setAlarm] = useState('5 mins before');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAlarmVisible, setModalAlarmVisible] = useState(false);
    const [tag, setTag] = useState('Work');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<{ hours: number; minutes: number }>({ hours: 12, minutes: 0 });
    const [lastSavedEventId, setLastSavedEventId] = useState<number | null>(null);

    // Hooks
    const { saveEvent, saveNotification, saveSchedule, isReady } = useDatabase();
    const { scheduleAlarmNotification } = useNotifications();

    const handleSaveEvent = async () => {
        if (!title.trim()) {
            Alert.alert("Error", "Please enter a title for the event");
            return;
        }

        if (!selectedDate) {
            Alert.alert("Error", "Please select a date for the event");
            return;
        }

        try {
            // Create event object
            const event: CalendarEvent = {
                event_name: title.trim(),
                description: description.trim(),
                event_date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
                event_time: `${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`,
                notif_time: alarm,
                notif_sent: false,
                category: tag,
            };

            // Save to database
            const eventId = await saveEvent(event);

            if (eventId) {
                console.log('Event saved with ID:', eventId);
                
                // Store the event ID in state for Button functionality
                setLastSavedEventId(eventId as number);
                
                // Create notification record
                await saveNotification({
                    user_id: 1, // Default user ID (you can modify this for multi-user support)
                    event_id: eventId as number,
                    status: 'scheduled'
                });

                // Create schedule record
                await saveSchedule({
                    user_id: 1, // Default user ID
                    event_id: eventId as number,
                    status: 'active'
                });

                // Schedule alarm notification
                const eventDateTime = new Date(selectedDate);
                eventDateTime.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);

                await scheduleAlarmNotification(
                    title,
                    description || 'Calendar event reminder',
                    eventDateTime,
                    alarm
                );

                Alert.alert("Success", `Event saved with ID: ${eventId}! Alarm scheduled and database records created.`);
            } else {
                Alert.alert("Error", "Failed to save event. No event ID returned.");
                setLastSavedEventId(null);
            }
            
            // Reset form
            setTitle('');
            setDescription('');
            setSelectedDate(undefined);
            setSelectedTime({ hours: 12, minutes: 0 });
            setAlarm('5 mins before');
            setTag('Work');
            setLastSavedEventId(null);

        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert("Error", "Failed to save event. Please try again.");
        }
    };

    const handleAlarmChange = (alarmOption: string) => {
        setAlarm(alarmOption);
        setModalAlarmVisible(false);
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080"
                    name="calendar"
                    style={styles.headerImage}
                />
            }
        >
            <ThemedView style={styles.calendarContainer}>
                <Text style={styles.title}>Pick a Date</Text>
                <CalendarDatePicker 
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                />
            </ThemedView>

            <ThemedView style={styles.calendarContainer}>
                <Text style={styles.title}>Pick a Time</Text>
                <CalendarTimePicker 
                    selectedTime={selectedTime}
                    onTimeChange={setSelectedTime}
                />
            </ThemedView>

            <ThemedView style={styles.container}>
                <ThemedText style={styles.header}>Title</ThemedText>
                <ThemedTextInput 
                    style={styles.textInput} 
                    placeholder="Add Title" 
                    value={title} 
                    onChangeText={setTitle} 
                />
                <ThemedText style={styles.header}>Description (optional)</ThemedText>
                <ThemedTextInput 
                    style={styles.textInputBig} 
                    placeholder="Add Description" 
                    value={description} 
                    onChangeText={setDescription} 
                    multiline
                />
            </ThemedView>

            <ThemedView style={styles.container}>
                <ThemedText style={styles.header}>Alarm: {alarm}</ThemedText>
                <Button 
                    mode="outlined" 
                    onPress={() => setModalAlarmVisible(true)}
                    style={styles.button}
                >
                    Set Alarm
                </Button>
            </ThemedView>

            <ThemedModal
                transparent={true}
                animationType="fade"
                visible={modalAlarmVisible}
                onRequestClose={() => setModalAlarmVisible(false)}
                onDismiss={() => setModalAlarmVisible(false)}>
                <View style={styles.modalContainer}>
                    <ThemedView style={styles.modalView}>
                        <ThemedText style={styles.header}>Set Alarm</ThemedText>
                        <ThemedText style={styles.alarm} onPress={() => handleAlarmChange('5 mins before')}>
                            5 mins before
                        </ThemedText>
                        <ThemedText style={styles.alarm} onPress={() => handleAlarmChange('10 mins before')}>
                            10 mins before
                        </ThemedText>
                        <ThemedText style={styles.alarm} onPress={() => handleAlarmChange('15 mins before')}>
                            15 mins before
                        </ThemedText>
                        <ThemedText style={styles.alarm} onPress={() => handleAlarmChange('1 hour before')}>
                            1 hour before
                        </ThemedText>
                        <ThemedText style={styles.alarm} onPress={() => handleAlarmChange('1 day before')}>
                            1 day before
                        </ThemedText>
                    </ThemedView>
                </View>
            </ThemedModal>

            <ThemedView style={styles.container}>
                <ThemedText style={styles.header}>Tag: {tag}</ThemedText>
                <Button 
                    mode="outlined" 
                    onPress={() => setModalVisible(true)}
                    style={styles.button}
                >
                    Change Tag
                </Button>
            </ThemedView>

            <SafeAreaView style={styles.centeredView}>
                <ThemedModal
                    transparent={true}
                    animationType="fade"
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                    onDismiss={() => setModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <ThemedView style={styles.modalView}>
                            <ThemedText style={styles.header}>Select Tag</ThemedText>
                            <ThemedText style={styles.tag} onPress={() => {
                                setTag('Work');
                                setModalVisible(false);
                            }}>Work</ThemedText>
                            <ThemedText style={styles.tag} onPress={() => {
                                setTag('Personal');
                                setModalVisible(false);
                            }}>Personal</ThemedText>
                            <ThemedText style={styles.tag} onPress={() => {
                                setTag('Family');
                                setModalVisible(false);
                            }}>Family</ThemedText>
                            <ThemedText style={styles.tag} onPress={() => {
                                setTag('Friends');
                                setModalVisible(false);
                            }}>Friends</ThemedText>
                            <ThemedText style={styles.tag} onPress={() => {
                                setTag('Other');
                                setModalVisible(false);
                            }}>Other</ThemedText>
                        </ThemedView>
                    </View>
                </ThemedModal>
            </SafeAreaView>

            <ThemedView style={styles.container}>
                <Button 
                    mode="contained" 
                    onPress={handleSaveEvent}
                    disabled={!isReady || !title.trim() || !selectedDate}
                    style={styles.saveButton}
                >
                    {lastSavedEventId ? `Event Saved (ID: ${lastSavedEventId})` : 'Save Event'}
                </Button>
                {lastSavedEventId && (
                    <ThemedText style={styles.eventIdText}>
                        Last saved event ID: {lastSavedEventId}
                    </ThemedText>
                )}
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    calendarContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        paddingBottom: 10,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    calendar: {
        width: 300,
        height: 350,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'white',
    },
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    textInput: {
        width: '100%',
        height: 40,
        borderRadius: 10,
        marginBottom: 15,
    },
    textInputBig: {
        width: '100%',
        height: 100,
        borderRadius: 10,
        marginBottom: 15,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 5,
    },
    text: {
        fontSize: 16,
        fontWeight: 'semibold',
        paddingBottom: 10,
    },
    alarm: {
        fontSize: 16,
        fontWeight: 'semibold',
        paddingBottom: 10,
        paddingVertical: 10,
        textAlign: 'center',
    },
    tag: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingBottom: 10,
        paddingVertical: 10,
        textAlign: 'center',
    },
    button: {
        marginVertical: 10,
    },
    saveButton: {
        marginVertical: 20,
        paddingVertical: 5,
    },
    eventIdText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
        opacity: 0.7,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(4, 0, 0, 0.55)',
    },
    modalView: {
        width: 300,
        height: 400,
        margin: 20,
        backgroundColor: '#1D3D47',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});