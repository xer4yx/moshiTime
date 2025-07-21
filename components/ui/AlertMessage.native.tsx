import { Alert } from "react-native";

export function AlertMessage(title: string, message: string) {
    Alert.alert(title, message,
        [
            {
            text: "Cancel",
            onPress: () => {  },
            style: "cancel"
            },
            { text: "OK", onPress: () => { } }
            ]
    );
}
