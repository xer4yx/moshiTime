import { useCallback, useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { TimePickerModal } from "react-native-paper-dates";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface CalendarTimePickerProps {
    selectedTime?: { hours: number; minutes: number };
    onTimeChange?: (time: { hours: number; minutes: number }) => void;
    buttonText?: string;
}

export const CalendarTimePicker = ({ 
    selectedTime, 
    onTimeChange, 
    buttonText = "Pick a time" 
}: CalendarTimePickerProps) => {
    const [time, setTime] = useState(selectedTime || { hours: 12, minutes: 0 });
    const [visible, setVisible] = useState(false);
    
    const onDismiss = useCallback(() => {
        setVisible(false);
    }, [setVisible]);

    const onConfirm = useCallback(
        ({ hours, minutes }: { hours: number, minutes: number }) => {
        const newTime = { hours, minutes };
        setVisible(false);
        setTime(newTime);
        onTimeChange?.(newTime);
    }, [setVisible, onTimeChange]);

    const formatTime = (hours: number, minutes: number) => {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
    };

    const displayText = time ? formatTime(time.hours, time.minutes) : buttonText;

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Button onPress={() => setVisible(true)} uppercase={false} mode="outlined">
                    {displayText}
                </Button>
                <TimePickerModal
                    visible={visible}
                    onDismiss={onDismiss}
                    onConfirm={onConfirm}
                    hours={time.hours}
                    minutes={time.minutes}
                />
            </View>
        </SafeAreaProvider>
    )
}