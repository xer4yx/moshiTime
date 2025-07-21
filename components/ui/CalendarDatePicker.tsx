import { useCallback, useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface CalendarDatePickerProps {
    selectedDate?: Date;
    onDateChange?: (date: Date | undefined) => void;
    buttonText?: string;
}

export const CalendarDatePicker = ({ 
    selectedDate, 
    onDateChange, 
    buttonText = "Pick a date" 
}: CalendarDatePickerProps) => {
    const [date, setDate] = useState<Date | undefined>(selectedDate);
    const [open, setOpen] = useState(false);

    const onDismissSingle = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const onConfirmSingle = useCallback(
        (params: any) => {
            setOpen(false);
            setDate(params.date);
            onDateChange?.(params.date);
        },
        [setDate, setOpen, onDateChange]
    );

    const displayText = date 
        ? date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : buttonText;

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Button onPress={() => setOpen(true)} uppercase={false} mode="outlined">
                    {displayText}
                </Button>
                <DatePickerModal
                    locale="en"
                    mode="single"
                    visible={open}
                    onDismiss={onDismissSingle}
                    onConfirm={onConfirmSingle}
                    date={date}
                />
            </View>
        </SafeAreaProvider>
    )
}